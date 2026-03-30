import AppKit
import Foundation
import UserNotifications

private struct LaunchTarget: Codable {
  let appName: String
  let workspacePath: String
}

private struct NotificationPayload: Decodable {
  let actionText: String?
  let body: String
  let launchTargets: [LaunchTarget]
  let signature: String
  let subtitle: String?
  let title: String
}

private struct StoredNotificationPayload: Codable {
  let launchTargets: [LaunchTarget]
  let signature: String
}

private enum AuthorizationStatus: String, Encodable {
  case authorized
  case denied
  case notDetermined = "not-determined"
}

private struct HelperResult: Encodable {
  let authorizationStatus: AuthorizationStatus
  let message: String?
}

private enum HelperModeError: Error {
  case invalidArguments
  case invalidPayload
}

private enum HelperMode {
  case authorize(resultFilePath: String)
  case idle
  case notify(NotificationPayload)
  case status(resultFilePath: String)
}

private final class HelperAppDelegate: NSObject, NSApplicationDelegate, UNUserNotificationCenterDelegate {
  private let dismissActionIdentifier = UNNotificationDismissActionIdentifier
  private let idleTimeoutInterval: TimeInterval = 15
  private let mode: HelperMode
  private let notificationCategoryIdentifier = "com.galactic.ide.notifier.open"
  private let openActionIdentifier = "com.galactic.ide.notifier.open.action"
  private let notificationPayloadUserInfoKey = "com.galactic.ide.notifier.payload"
  private var timeoutWorkItem: DispatchWorkItem?

  init(mode: HelperMode) {
    self.mode = mode
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    let center = UNUserNotificationCenter.current()
    center.delegate = self

    switch mode {
    case .authorize(let resultFilePath):
      resolveAuthorization(center: center, resultFilePath: resultFilePath)
    case .idle:
      scheduleIdleTermination()
    case .notify(let payload):
      center.setNotificationCategories([buildNotificationCategory(payload)])
      scheduleNotification(center: center, payload: payload)
    case .status(let resultFilePath):
      writeCurrentStatus(center: center, resultFilePath: resultFilePath)
    }
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    willPresent notification: UNNotification,
    withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
  ) {
    completionHandler([.banner, .list, .sound])
  }

  func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
  ) {
    switch response.actionIdentifier {
    case openActionIdentifier:
      guard let launchTargets = resolveLaunchTargets(for: response) else {
        completionHandler()
        terminate()
        return
      }
      completionHandler()
      openWorkspaceTargetsAndTerminate(launchTargets)
    case dismissActionIdentifier, UNNotificationDefaultActionIdentifier:
      completionHandler()
      terminate()
    default:
      completionHandler()
      terminate()
    }
  }

  private func resolveAuthorization(center: UNUserNotificationCenter, resultFilePath: String) {
    center.getNotificationSettings { [weak self] settings in
      guard let self else { return }
      let status = mapAuthorizationStatus(settings.authorizationStatus)
      if status != .notDetermined {
        self.writeResultAndTerminate(
          resultFilePath: resultFilePath,
          authorizationStatus: status,
          message: authorizationMessage(for: status),
        )
        return
      }

      center.requestAuthorization(options: [.alert, .sound]) { granted, error in
        if granted {
          self.writeResultAndTerminate(resultFilePath: resultFilePath, authorizationStatus: .authorized)
          return
        }

        let deniedMessage = error?.localizedDescription ?? self.authorizationMessage(for: .denied)
        self.writeResultAndTerminate(
          resultFilePath: resultFilePath,
          authorizationStatus: .denied,
          message: deniedMessage,
        )
      }
    }
  }

  private func writeCurrentStatus(center: UNUserNotificationCenter, resultFilePath: String) {
    center.getNotificationSettings { [weak self] settings in
      guard let self else { return }
      let status = self.mapAuthorizationStatus(settings.authorizationStatus)
      self.writeResultAndTerminate(
        resultFilePath: resultFilePath,
        authorizationStatus: status,
        message: self.authorizationMessage(for: status),
      )
    }
  }

  private func buildNotificationCategory(_ payload: NotificationPayload) -> UNNotificationCategory {
    let actions: [UNNotificationAction]
    if let actionText = payload.actionText, !payload.launchTargets.isEmpty {
      actions = [UNNotificationAction(identifier: openActionIdentifier, title: actionText, options: [])]
    } else {
      actions = []
    }

    return UNNotificationCategory(
      identifier: notificationCategoryIdentifier,
      actions: actions,
      intentIdentifiers: [],
      options: [.customDismissAction],
    )
  }

  private func scheduleNotification(center: UNUserNotificationCenter, payload: NotificationPayload) {
    center.getNotificationSettings { [weak self] settings in
      guard let self else { return }
      guard mapAuthorizationStatus(settings.authorizationStatus) == .authorized else {
        self.terminate()
        return
      }

      let content = UNMutableNotificationContent()
      content.title = payload.title
      content.body = payload.body
      content.sound = .default
      if let subtitle = payload.subtitle, !subtitle.isEmpty {
        content.subtitle = subtitle
      }
      content.categoryIdentifier = notificationCategoryIdentifier
      if let encodedPayload = encodeStoredNotificationPayload(payload) {
        content.userInfo = [notificationPayloadUserInfoKey: encodedPayload]
      }

      let request = UNNotificationRequest(identifier: payload.signature, content: content, trigger: nil)
      center.removeDeliveredNotifications(withIdentifiers: [payload.signature])
      center.removePendingNotificationRequests(withIdentifiers: [payload.signature])
      center.add(request) { _ in
        DispatchQueue.main.async {
          self.terminate()
        }
      }
    }
  }

  private func encodeStoredNotificationPayload(_ payload: NotificationPayload) -> String? {
    let storedPayload = StoredNotificationPayload(
      launchTargets: payload.launchTargets,
      signature: payload.signature,
    )
    guard let payloadData = try? JSONEncoder().encode(storedPayload) else {
      return nil
    }

    return payloadData.base64EncodedString()
  }

  private func loadStoredNotificationPayload(
    signature: String,
    from userInfo: [AnyHashable: Any],
  ) -> StoredNotificationPayload? {
    guard let encodedPayload = userInfo[notificationPayloadUserInfoKey] as? String,
          let payloadData = Data(base64Encoded: encodedPayload) else {
      return nil
    }

    if let payload = try? JSONDecoder().decode(NotificationPayload.self, from: payloadData),
       payload.signature == signature {
      return StoredNotificationPayload(
        launchTargets: payload.launchTargets,
        signature: payload.signature,
      )
    }

    guard let storedPayload = try? JSONDecoder().decode(StoredNotificationPayload.self, from: payloadData),
          storedPayload.signature == signature else {
      return nil
    }

    return storedPayload
  }

  private func resolveLaunchTargets(for response: UNNotificationResponse) -> [LaunchTarget]? {
    let signature = response.notification.request.identifier
    if case .notify(let payload) = mode, payload.signature == signature {
      return payload.launchTargets
    }

    return loadStoredNotificationPayload(
      signature: signature,
      from: response.notification.request.content.userInfo,
    )?.launchTargets
  }

  private func openWorkspaceTargetsAndTerminate(_ launchTargets: [LaunchTarget]) {
    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
      for target in launchTargets {
        guard FileManager.default.fileExists(atPath: target.workspacePath) else {
          continue
        }

        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/open")
        process.arguments = ["-a", target.appName, target.workspacePath]

        do {
          try process.run()
          process.waitUntilExit()
          if process.terminationStatus == 0 {
            break
          }
        } catch {
          continue
        }
      }

      DispatchQueue.main.async {
        self?.terminate()
      }
    }
  }

  private func writeResultAndTerminate(
    resultFilePath: String,
    authorizationStatus: AuthorizationStatus,
    message: String? = nil,
  ) {
    let result = HelperResult(authorizationStatus: authorizationStatus, message: message)
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.sortedKeys]

    do {
      let data = try encoder.encode(result)
      try data.write(to: URL(fileURLWithPath: resultFilePath), options: [.atomic])
    } catch {
      exit(1)
    }

    terminate()
  }

  private func authorizationMessage(for status: AuthorizationStatus) -> String? {
    switch status {
    case .authorized:
      return nil
    case .denied:
      return "Notifications are blocked for Galactic in macOS Settings."
    case .notDetermined:
      return "Notification permission has not been granted yet."
    }
  }

  private func mapAuthorizationStatus(_ status: UNAuthorizationStatus) -> AuthorizationStatus {
    if status == .authorized {
      return .authorized
    }
    if status == .denied {
      return .denied
    }
    if status == .notDetermined {
      return .notDetermined
    }
    return .authorized
  }

  private func scheduleIdleTermination() {
    let workItem = DispatchWorkItem { [weak self] in self?.terminate() }
    timeoutWorkItem = workItem
    DispatchQueue.main.asyncAfter(deadline: .now() + idleTimeoutInterval, execute: workItem)
  }

  private func terminate() {
    timeoutWorkItem?.cancel()
    timeoutWorkItem = nil
    NSApp.terminate(nil)
  }
}

private func parseResultFilePath() throws -> String {
  guard let resultIndex = CommandLine.arguments.firstIndex(of: "--result-file"),
        CommandLine.arguments.indices.contains(resultIndex + 1) else {
    throw HelperModeError.invalidArguments
  }

  return CommandLine.arguments[resultIndex + 1]
}

private func parsePayload() throws -> NotificationPayload {
  guard let payloadIndex = CommandLine.arguments.firstIndex(of: "--payload"),
        CommandLine.arguments.indices.contains(payloadIndex + 1) else {
    throw HelperModeError.invalidArguments
  }

  let encodedPayload = CommandLine.arguments[payloadIndex + 1]
  guard let payloadData = Data(base64Encoded: encodedPayload) else {
    throw HelperModeError.invalidPayload
  }

  return try JSONDecoder().decode(NotificationPayload.self, from: payloadData)
}

private func parseMode() throws -> HelperMode {
  if CommandLine.arguments.count <= 1 {
    return .idle
  }
  if CommandLine.arguments.contains("--status") {
    return .status(resultFilePath: try parseResultFilePath())
  }
  if CommandLine.arguments.contains("--authorize") {
    return .authorize(resultFilePath: try parseResultFilePath())
  }
  if CommandLine.arguments.contains("--notify") {
    return .notify(try parsePayload())
  }
  throw HelperModeError.invalidArguments
}

do {
  let mode = try parseMode()
  let application = NSApplication.shared
  let delegate = HelperAppDelegate(mode: mode)
  application.delegate = delegate
  application.setActivationPolicy(.accessory)
  application.run()
} catch {
  exit(1)
}
