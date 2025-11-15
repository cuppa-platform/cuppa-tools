//
//  CuppaToggleField.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaToggleField component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: toggle-field.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// A toggle switch with label and optional description
///
/// Features:
/// - Toggle label
/// - Binding to toggle state
/// - Optional description text
/// - Whether toggle is disabled
///
/// Example:
/// ```swift
/// CuppaToggleField("title")
/// ```
public struct CuppaToggleField: View {
    // MARK: - Properties

    let title: String
    @Binding var isOn: Bool
    let description: String?
    let isDisabled: Bool

    // MARK: - Initialization

    public init(
        title: String,
        isOn: Binding<Bool>,
        description: String?,
        isDisabled: Bool = false
    ) {
        self.title = title
        _isOn = isOn
        self.description = description
        self.isDisabled = isDisabled
    }

    // MARK: - Body

    public var body: some View {
            Text(title)
            .font(.body)
            .foregroundStyle(.primary)
            .padding(.vertical, 12)
            .padding(.horizontal, 0)
            .background(.clear)
    }
}

#Preview("CuppaToggleField") {
    @Previewable @State var previewBool = false
    VStack(spacing: 20) {
        CuppaToggleField(title: "CuppaToggleField", isOn: $previewBool, description: nil)
    }
    .padding()
}