//
//  CuppaPickerField.swift
//  CuppaUI
//
//  Generated from component specifications on 2025-11-15.
//  Copyright © 2025 MyCuppa. All rights reserved.
//
//  CuppaPickerField component
//
//  ⚠️ DO NOT EDIT: This file is auto-generated from component specifications.
//  Source: picker-field.json
//  To make changes, update the component JSON files and regenerate.
//

import SwiftUI

/// A picker field with label for selecting from options
///
/// Features:
/// - Field label
/// - Binding to selected value
/// - Available options
/// - Placeholder text
///
/// Example:
/// ```swift
/// CuppaPickerField("title")
/// ```
public struct CuppaPickerField: View {
    // MARK: - Properties

    let title: String
    @Binding var selection: String
    let options: [String]
    let placeholder: String

    // MARK: - Initialization

    public init(
        title: String,
        selection: Binding<String>,
        options: [String],
        placeholder: String = "Select an option"
    ) {
        self.title = title
        _selection = selection
        self.options = options
        self.placeholder = placeholder
    }

    // MARK: - Body

    public var body: some View {
            Text(title)
            .font(.body)
            .foregroundStyle(.primary)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(.clear)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .strokeBorder(.gray, lineWidth: 1)
            )
            .frame(minHeight: 44)
    }
}

#Preview("CuppaPickerField") {
    @Previewable @State var previewText = ""
    VStack(spacing: 20) {
        CuppaPickerField(title: "CuppaPickerField", selection: $previewText, options: ["Option 1", "Option 2", "Option 3"])
    }
    .padding()
}