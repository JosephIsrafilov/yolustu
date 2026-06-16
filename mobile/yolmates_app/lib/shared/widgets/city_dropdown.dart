import 'package:flutter/material.dart';
import '../../core/constants.dart';
import '../../core/theme.dart';

class CityDropdown extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final ValueChanged<String> onChanged;
  final bool isDark;

  const CityDropdown({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    required this.onChanged,
    this.isDark = false,
  });

  void _showSelectionSheet(BuildContext context) {
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
                label,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.navy,
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  itemCount: AppConstants.cities.length,
                  itemBuilder: (context, index) {
                    final city = AppConstants.cities[index];
                    final isSelected = city == value;
                    return ListTile(
                      title: Text(
                        city,
                        style: TextStyle(
                          color: isSelected ? AppTheme.tealDark : AppTheme.navy,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle, color: AppTheme.teal)
                          : null,
                      onTap: () {
                        Navigator.of(context).pop();
                        onChanged(city);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => _showSelectionSheet(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isDark ? Colors.white.withValues(alpha: 0.1) : AppTheme.slate200,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isDark ? AppTheme.tealLight : AppTheme.slate500,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: isDark ? Colors.white.withValues(alpha: 0.5) : AppTheme.slate500,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    value,
                    style: TextStyle(
                      color: isDark ? Colors.white : AppTheme.navy,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.keyboard_arrow_down,
              color: isDark ? Colors.white.withValues(alpha: 0.5) : AppTheme.slate500,
            ),
          ],
        ),
      ),
    );
  }
}
