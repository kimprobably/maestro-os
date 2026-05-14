import SwiftUI
import Core
import DesignSystem
import Localization

@MainActor
struct WakeDashboardView: View {
    @State private var viewModel: WakeFlowViewModel
    @State private var showCreateAlarm = false

    @State private var draftTitle = ""
    @State private var draftFirstTask = ""
    @State private var draftTime = Date()
    @State private var draftStrictness: WakeStrictness = .balanced
    @State private var draftAlarmID: UUID?

    init(viewModel: WakeFlowViewModel) {
        self.viewModel = viewModel
    }

    var body: some View {
        NavigationStack {
            List {
                consistencySection
                alarmsSection
                reliabilitySection
                if let run = viewModel.activeRun {
                    activeRunSection(run)
                }
            }
            .listStyle(.insetGrouped)
            .dynamicTypeSize(...DynamicTypeSize.accessibility3)
            .navigationTitle(L10n.Wake.title)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showCreateAlarm = true
                    } label: {
                        Label(L10n.Wake.addAlarm, systemImage: "plus")
                    }
                    .accessibilityLabel(L10n.Wake.A11y.addAlarmLabel)
                    .accessibilityHint(L10n.Wake.A11y.addAlarmHint)
                    .accessibilityIdentifier("wakeAddAlarmButton")
                }
            }
            .task {
                await viewModel.load()
            }
            .refreshable {
                await viewModel.load()
            }
            .task(id: viewModel.activeRun?.id) {
                while viewModel.activeRun?.state == .dismissedAwaitingCheck {
                    await viewModel.evaluateEscalationIfNeeded()
                    try? await Task.sleep(nanoseconds: 15_000_000_000)
                }
            }
            .sheet(isPresented: $showCreateAlarm) {
                createAlarmSheet
            }
            .alert(
                L10n.Wake.errorTitle,
                isPresented: Binding(
                    get: { viewModel.errorMessage != nil },
                    set: { _ in }
                ),
                actions: {
                    Button(L10n.Common.ok) {}
                },
                message: {
                    Text(viewModel.errorMessage ?? L10n.Error.generic)
                }
            )
        }
    }

    private var consistencySection: some View {
        Section {
            HStack {
                Text(L10n.Wake.consistency)
                Spacer()
                Text(consistencyPercent)
                    .font(DSTypography.body)
                    .fontWeight(.semibold)
                    .foregroundStyle(DSColors.primary)
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(L10n.Wake.A11y.weeklyConsistency(consistencyPercent))
            .accessibilityIdentifier("wakeConsistencyRow")
        } header: {
            Text(L10n.Wake.thisWeek)
        }
    }

    private var alarmsSection: some View {
        Section {
            if viewModel.alarms.isEmpty {
                Text(L10n.Wake.noAlarms)
                    .foregroundStyle(DSColors.textSecondary)
                    .accessibilityIdentifier("wakeNoAlarmsText")
            } else {
                ForEach(viewModel.alarms) { alarm in
                    VStack(alignment: .leading, spacing: DSSpacing.xs) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(alarm.title)
                                    .font(DSTypography.body)
                                    .fontWeight(.semibold)
                                Text(timeString(for: alarm))
                                    .font(DSTypography.caption)
                                    .foregroundStyle(DSColors.textSecondary)
                            }
                            Spacer()
                            Toggle("", isOn: Binding(
                                get: { alarm.enabled },
                                set: { isOn in
                                    Task { await viewModel.setAlarmEnabled(id: alarm.id, enabled: isOn) }
                                }
                            ))
                            .labelsHidden()
                            .accessibilityLabel(L10n.Wake.A11y.enableAlarm(alarm.title))
                            .accessibilityIdentifier("wakeAlarmToggle-\(alarm.id.uuidString)")
                        }

                        HStack {
                            Text(L10n.Wake.strictness(alarm.strictness.rawValue.capitalized))
                                .font(DSTypography.caption)
                                .foregroundStyle(DSColors.textSecondary)
                            Spacer()
                            Button(L10n.Wake.startRun) {
                                Task { await viewModel.triggerAlarm(alarmID: alarm.id) }
                            }
                            .buttonStyle(.borderedProminent)
                            .accessibilityLabel(L10n.Wake.A11y.startRun(alarm.title))
                            .accessibilityHint(L10n.Wake.A11y.startRunHint)
                            .accessibilityIdentifier("wakeStartRunButton-\(alarm.id.uuidString)")
                            Button(L10n.Wake.editAlarm) {
                                editAlarm(alarm)
                            }
                            .buttonStyle(.bordered)
                            .accessibilityLabel(L10n.Wake.A11y.editAlarm(alarm.title))
                            .accessibilityIdentifier("wakeEditAlarmButton-\(alarm.id.uuidString)")
                        }
                    }
                    .padding(.vertical, DSSpacing.xs)
                    .accessibilityElement(children: .contain)
                    .accessibilityIdentifier("wakeAlarmCell-\(alarm.id.uuidString)")
                }
            }
        } header: {
            Text(L10n.Wake.alarms)
        }
    }

    private var reliabilitySection: some View {
        Section {
            if viewModel.recentRuns.isEmpty {
                Text(L10n.Wake.noReliabilityEvents)
                    .foregroundStyle(DSColors.textSecondary)
                    .accessibilityIdentifier("wakeReliabilityEmptyText")
            } else {
                ForEach(viewModel.recentRuns, id: \.id) { run in
                    HStack(alignment: .firstTextBaseline) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(run.scheduledAt.formatted(date: .abbreviated, time: .shortened))
                                .font(DSTypography.body)
                                .fontWeight(.semibold)
                            Text(L10n.Wake.runState(run.state.rawValue.capitalized))
                                .font(DSTypography.caption)
                                .foregroundStyle(DSColors.textSecondary)
                        }
                        Spacer()
                        if run.escalationTriggeredAt != nil {
                            Text(L10n.Wake.escalated)
                                .font(DSTypography.caption)
                                .foregroundStyle(DSColors.danger)
                                .accessibilityIdentifier("wakeReliabilityEscalatedBadge")
                        }
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityIdentifier("wakeReliabilityRow-\(run.id.uuidString)")
                }
            }
        } header: {
            Text(L10n.Wake.reliabilityLedger)
        }
    }

    private func activeRunSection(_ run: WakeRun) -> some View {
        Section {
            Text(L10n.Wake.runState(run.state.rawValue.capitalized))
                .font(DSTypography.body)
                .fontWeight(.semibold)
                .accessibilityIdentifier("wakeRunStateText")

            ForEach(run.missions) { mission in
                Button {
                    Task { await viewModel.completeMission(missionID: mission.id) }
                } label: {
                    HStack {
                        Image(systemName: run.completedMissionIDs.contains(mission.id) ? "checkmark.circle.fill" : "circle")
                        VStack(alignment: .leading, spacing: 2) {
                            Text(mission.prompt)
                            Text(mission.modality.rawValue.capitalized)
                                .font(DSTypography.caption)
                                .foregroundStyle(DSColors.textSecondary)
                        }
                        Spacer()
                    }
                }
                .disabled(run.completedMissionIDs.contains(mission.id))
                .accessibilityLabel(L10n.Wake.A11y.completeMission(mission.prompt))
                .accessibilityIdentifier("wakeMissionButton-\(mission.id.uuidString)")
            }

            Button(L10n.Wake.completeWakeCheck) {
                Task { await viewModel.completeWakeCheck() }
            }
            .buttonStyle(.bordered)
            .disabled(run.state != .dismissedAwaitingCheck && run.state != .escalated)
            .accessibilityLabel(L10n.Wake.A11y.completeWakeCheckLabel)
            .accessibilityHint(L10n.Wake.A11y.completeWakeCheckHint)
            .accessibilityIdentifier("wakeCompleteWakeCheckButton")

            Button(L10n.Wake.completeFirstTask) {
                Task { await viewModel.completeFirstTask() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(run.state != .verified)
            .accessibilityLabel(L10n.Wake.A11y.completeFirstTaskLabel)
            .accessibilityHint(L10n.Wake.A11y.completeFirstTaskHint)
            .accessibilityIdentifier("wakeCompleteFirstTaskButton")

            Button(L10n.Wake.dismissAlarm) {
                Task { await viewModel.dismissAlarm() }
            }
            .buttonStyle(.bordered)
            .tint(DSColors.danger)
            .disabled(!run.allMissionsCompleted)
            .accessibilityLabel(L10n.Wake.A11y.dismissAlarmLabel)
            .accessibilityHint(L10n.Wake.A11y.dismissAlarmHint)
            .accessibilityIdentifier("wakeDismissAlarmButton")
        } header: {
            Text(L10n.Wake.activeRun)
        }
    }

    private var createAlarmSheet: some View {
        NavigationStack {
            Form {
                Section {
                    TextField(L10n.Wake.alarmName, text: $draftTitle)
                        .textInputAutocapitalization(.words)
                        .accessibilityLabel(L10n.Wake.A11y.alarmNameField)
                        .accessibilityIdentifier("wakeAlarmNameField")
                    DatePicker(L10n.Wake.time, selection: $draftTime, displayedComponents: .hourAndMinute)
                        .accessibilityLabel(L10n.Wake.A11y.alarmTimeField)
                        .accessibilityIdentifier("wakeAlarmTimePicker")
                    Picker(L10n.Wake.strictnessLabel, selection: $draftStrictness) {
                        Text(L10n.Wake.relaxed).tag(WakeStrictness.relaxed)
                        Text(L10n.Wake.balanced).tag(WakeStrictness.balanced)
                        Text(L10n.Wake.strict).tag(WakeStrictness.strict)
                    }
                    .accessibilityLabel(L10n.Wake.A11y.strictnessPicker)
                    .accessibilityIdentifier("wakeStrictnessPicker")
                    TextField(L10n.Wake.firstTask, text: $draftFirstTask)
                        .textInputAutocapitalization(.sentences)
                        .accessibilityLabel(L10n.Wake.A11y.firstTaskField)
                        .accessibilityIdentifier("wakeFirstTaskField")
                }
            }
            .navigationTitle(draftAlarmID == nil ? L10n.Wake.newAlarm : L10n.Wake.editAlarm)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(L10n.Common.cancel) {
                        resetDraft()
                        showCreateAlarm = false
                    }
                    .accessibilityIdentifier("wakeAlarmCancelButton")
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(L10n.Common.save) {
                        Task { await saveAlarm() }
                    }
                    .disabled(draftTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || draftFirstTask.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    .accessibilityIdentifier("wakeAlarmSaveButton")
                }
            }
        }
    }

    private var consistencyPercent: String {
        "\(Int((viewModel.weeklyConsistency * 100).rounded()))%"
    }

    private func timeString(for alarm: WakeAlarm) -> String {
        let components = DateComponents(hour: alarm.hour, minute: alarm.minute)
        let calendar = Calendar.current
        guard let date = calendar.date(from: components) else {
            return String(format: "%02d:%02d", alarm.hour, alarm.minute)
        }

        return date.formatted(date: .omitted, time: .shortened)
    }

    private func saveAlarm() async {
        let components = Calendar.current.dateComponents([.hour, .minute], from: draftTime)
        let title = draftTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let firstTask = draftFirstTask.trimmingCharacters(in: .whitespacesAndNewlines)
        if let draftAlarmID {
            await viewModel.updateAlarm(
                id: draftAlarmID,
                title: title,
                hour: components.hour ?? 7,
                minute: components.minute ?? 0,
                strictness: draftStrictness,
                firstTaskTitle: firstTask
            )
        } else {
            await viewModel.createAlarm(
                title: title,
                hour: components.hour ?? 7,
                minute: components.minute ?? 0,
                strictness: draftStrictness,
                firstTaskTitle: firstTask
            )
        }
        resetDraft()
        showCreateAlarm = false
    }

    private func editAlarm(_ alarm: WakeAlarm) {
        draftAlarmID = alarm.id
        draftTitle = alarm.title
        draftFirstTask = alarm.firstTaskTitle
        draftStrictness = alarm.strictness
        draftTime = Calendar.current.date(from: DateComponents(hour: alarm.hour, minute: alarm.minute)) ?? Date()
        showCreateAlarm = true
    }

    private func resetDraft() {
        draftAlarmID = nil
        draftTitle = ""
        draftFirstTask = ""
        draftTime = Date()
        draftStrictness = .balanced
    }
}
