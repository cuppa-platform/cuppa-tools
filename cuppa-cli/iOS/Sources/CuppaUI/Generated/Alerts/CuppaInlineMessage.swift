//
//  CuppaInlineMessage.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaInlineMessage component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: inline-message.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// An inline message for contextual feedback
///
/// Features:
/// - Message text
/// - Message type: success, warning, error, info
/// - Whether to show type icon
///
/// Example:
/// ```swift
/// CuppaInlineMessage("message")
/// ```
public struct CuppaInlineMessage: View {
    // MARK: - Properties

    let message: String
    let type: String
    let showIcon: Bool

    // MARK: - Initialization

    public init(
        message: String,
        type: String,
        showIcon: Bool = true
    ) {
        self.message = message
        self.type = type
        self.showIcon = showIcon
    }

    // MARK: - Body

    public var body: some View {
            Text(message)
            .font(.caption)
            .foregroundStyle(.blue)
            .padding(.vertical, 8)
            .padding(.horizontal, 12)
            .background(.clear)
    }
}

#Preview("CuppaInlineMessage") {
    VStack(spacing: 20) {
        CuppaInlineMessage(message: "This is a message", type: "info")
    }
    .padding()
}