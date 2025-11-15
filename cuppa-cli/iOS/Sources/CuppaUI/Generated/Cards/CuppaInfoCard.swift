//
//  CuppaInfoCard.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaInfoCard component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: info-card.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// An informational card with icon, title, and description
///
/// Features:
/// - SF Symbol icon name
/// - Card title
/// - Card description
/// - Icon color
///
/// Example:
/// ```swift
/// CuppaInfoCard("icon")
/// ```
public struct CuppaInfoCard: View {
    // MARK: - Properties

    let icon: String
    let title: String
    let description: String
    let iconColor: String

    // MARK: - Initialization

    public init(
        icon: String,
        title: String,
        description: String,
        iconColor: String = "blue"
    ) {
        self.icon = icon
        self.title = title
        self.description = description
        self.iconColor = iconColor
    }

    // MARK: - Body

    public var body: some View {
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
    }
}

#Preview("CuppaInfoCard") {
    VStack(spacing: 20) {
        CuppaInfoCard(icon: "star.fill", title: "CuppaInfoCard", description: "Description text")
    }
    .padding()
}