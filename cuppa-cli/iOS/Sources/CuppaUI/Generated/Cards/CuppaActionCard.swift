//
//  CuppaActionCard.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaActionCard component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: action-card.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// A tappable card with icon, title, subtitle, and trailing chevron
///
/// Features:
/// - SF Symbol icon name
/// - Card title
/// - Card subtitle
/// - Whether to show trailing chevron
///
/// Example:
/// ```swift
/// CuppaActionCard("icon")
/// ```
public struct CuppaActionCard: View {
    // MARK: - Properties

    let icon: String
    let title: String
    let subtitle: String?
    let showChevron: Bool
    let action: () -> Void

    // MARK: - Initialization

    public init(
        icon: String,
        title: String,
        subtitle: String?,
        showChevron: Bool = true,
        action: @escaping () -> Void
    ) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.showChevron = showChevron
        self.action = action
    }

    // MARK: - Body

    public var body: some View {
        Button {
            action()
        } label: {
            Image(systemName: icon)
            .font(.body)
            .foregroundStyle(.primary)
            .padding(.vertical, 16)
            .padding(.horizontal, 16)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .strokeBorder(.gray, lineWidth: 1)
            )
            .frame(minHeight: 60)
        }
        .buttonStyle(.plain)
    }
}

#Preview("CuppaActionCard") {
    VStack(spacing: 20) {
        CuppaActionCard(icon: "star.fill", title: "CuppaActionCard", subtitle: nil) {
            print("Action triggered")
        }
    }
    .padding()
}