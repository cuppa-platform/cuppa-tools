//
//  IconButton.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  IconButton component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: icon-button.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI
import CuppaCore

/// A button with an icon, used for toolbar actions and compact interfaces
///
/// Features:
/// - Async action support
/// - Synchronous action support
/// - Loading state with spinner
/// - Automatic state management
/// - SF Symbol name for the icon
/// - Accessibility label
/// - Whether the button is in loading state
///
/// Example:
/// ```swift
/// IconButton("icon") {
///     // Handle action
/// }
/// ```
public struct IconButton: View {
    // MARK: - Properties

    let icon: String
    let label: String
    let isLoading: Bool
    @State private var isPerformingAction = false
    let action: () async -> Void

    // MARK: - Initialization

    /// Async action initializer
    public init(
        icon: String,
        label: String,
        isLoading: Bool = false,
        action: @escaping () async -> Void
    ) {
        self.icon = icon
        self.label = label
        self.isLoading = isLoading
        self.action = action
    }

    /// Synchronous action initializer
    public init(
        icon: String,
        label: String,
        isLoading: Bool = false,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.label = label
        self.isLoading = isLoading
        self.action = {
            Task { action() }
        }
    }

    // MARK: - Body

    public var body: some View {
        Button {
            handleAction()
        } label: {
            ZStack {
                Image(systemName: icon)
                    .opacity((isLoading || isPerformingAction) ? 0 : 1)

                if isLoading || isPerformingAction {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle())
                }
            }
            .font(.title3)
            .foregroundStyle(.blue)
            .padding(.vertical, 12)
            .padding(.horizontal, 12)
            .background(.clear)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .frame(minHeight: 44)
        }
        .buttonStyle(.plain)
        .disabled(isLoading || isPerformingAction)
        .opacity((isLoading || isPerformingAction) ? 0.6 : 1.0)
    }

    // MARK: - Actions

    private func handleAction() {
        Task {
            isPerformingAction = true
            await action()
            isPerformingAction = false
        }
    }
}

#Preview("IconButton") {
    VStack(spacing: 20) {
        IconButton(icon: "star.fill", label: "Button") {
            // Async action
        }
    }
    .padding()
}