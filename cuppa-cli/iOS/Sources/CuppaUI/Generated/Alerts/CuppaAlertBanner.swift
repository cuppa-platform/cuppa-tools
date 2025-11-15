//
//  CuppaAlertBanner.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaAlertBanner component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: alert-banner.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// An alert banner for displaying important messages with icon and dismiss button
///
/// Features:
/// - Alert message
/// - Alert type: success, warning, error, info
/// - Whether to show type icon
/// - Whether alert can be dismissed
///
/// Example:
/// ```swift
/// CuppaAlertBanner("message")
/// ```
public struct CuppaAlertBanner: View {
    // MARK: - Properties

    let message: String
    let type: String
    let showIcon: Bool
    let isDismissible: Bool
    let onDismiss: () -> Void

    // MARK: - Initialization

    public init(
        message: String,
        type: String,
        showIcon: Bool = true,
        isDismissible: Bool = true,
        onDismiss: @escaping () -> Void
    ) {
        self.message = message
        self.type = type
        self.showIcon = showIcon
        self.isDismissible = isDismissible
        self.onDismiss = onDismiss
    }

    // MARK: - Body

    public var body: some View {
        Button {
            onDismiss()
        } label: {
            Text(message)
            .font(.body)
            .foregroundStyle(.white)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(.blue)
            .clipShape(RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }
}

#Preview("CuppaAlertBanner") {
    VStack(spacing: 20) {
        CuppaAlertBanner(message: "This is a message", type: "info") {
            print("Action triggered")
        }
    }
    .padding()
}