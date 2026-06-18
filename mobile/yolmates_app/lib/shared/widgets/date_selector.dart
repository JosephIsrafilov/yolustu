import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/theme.dart';

class DateSelector extends ConsumerWidget {
  final DateTime? selectedDate;
  final ValueChanged<DateTime?> onChanged;
  final bool isDark;

  const DateSelector({
    super.key,
    required this.selectedDate,
    required this.onChanged,
    this.isDark = false,
  });

  void _showSelectionSheet(BuildContext context, AppLocalizations l10n) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.slate200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                l10n.dateSelectTitle,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                title: Text(l10n.dateToday),
                leading: const Icon(Icons.today),
                onTap: () {
                  Navigator.pop(context);
                  onChanged(today);
                },
              ),
              ListTile(
                title: Text(l10n.dateTomorrow),
                leading: const Icon(Icons.event),
                onTap: () {
                  Navigator.pop(context);
                  onChanged(tomorrow);
                },
              ),
              ListTile(
                title: Text(l10n.dateThisWeek),
                leading: const Icon(Icons.date_range),
                onTap: () {
                  Navigator.pop(context);
                  onChanged(null); // null means any date / this week
                },
              ),
              const Divider(),
              ListTile(
                title: Text(l10n.dateFromCalendar),
                leading: const Icon(Icons.calendar_month),
                onTap: () async {
                  Navigator.pop(context);
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: selectedDate ?? today,
                    firstDate: today,
                    lastDate: today.add(const Duration(days: 90)),
                    builder: (context, child) {
                      return Theme(
                        data: Theme.of(context).copyWith(
                          colorScheme: const ColorScheme.light(
                            primary: AppTheme.teal,
                            onPrimary: Colors.white,
                            onSurface: AppTheme.navy,
                          ),
                        ),
                        child: child!,
                      );
                    },
                  );
                  if (picked != null) {
                    onChanged(picked);
                  }
                },
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = ref.watch(l10nProvider);
    String text = l10n.dateOptional;
    if (selectedDate != null) {
      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final tomorrow = today.add(const Duration(days: 1));

      final selected =
          DateTime(selectedDate!.year, selectedDate!.month, selectedDate!.day);
      if (selected == today) {
        text = l10n.dateToday;
      } else if (selected == tomorrow) {
        text = l10n.dateTomorrow;
      } else {
        text = '${selected.day}.${selected.month}.${selected.year}';
      }
    }

    return InkWell(
      onTap: () => _showSelectionSheet(context, l10n),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color:
              isDark ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.1)
                : AppTheme.slate200,
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.calendar_today,
              color: isDark ? AppTheme.tealLight : AppTheme.slate500,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.dateDeparture,
                    style: TextStyle(
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.5)
                          : AppTheme.slate500,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    text,
                    style: TextStyle(
                      color: selectedDate != null
                          ? (isDark ? Colors.white : AppTheme.navy)
                          : (isDark
                              ? Colors.white.withValues(alpha: 0.5)
                              : AppTheme.slate500),
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.keyboard_arrow_down,
              color: isDark
                  ? Colors.white.withValues(alpha: 0.5)
                  : AppTheme.slate500,
            ),
          ],
        ),
      ),
    );
  }
}
