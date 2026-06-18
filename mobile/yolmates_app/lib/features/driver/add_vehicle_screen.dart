import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/theme.dart';
import '../../core/localization/app_localizations.dart';
import 'data/vehicle.dart';
import 'data/driver_controller.dart';

/// Add a driver vehicle (mock).
///
/// Saves via [vehiclesProvider]; on success pops back to the previous screen.
class AddVehicleScreen extends ConsumerStatefulWidget {
  const AddVehicleScreen({super.key});

  @override
  ConsumerState<AddVehicleScreen> createState() => _AddVehicleScreenState();
}

class _AddVehicleScreenState extends ConsumerState<AddVehicleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _brand = TextEditingController();
  final _model = TextEditingController();
  final _year = TextEditingController();
  final _color = TextEditingController();
  final _plate = TextEditingController();
  int _seats = 4;

  bool _saving = false;
  String? _error;

  @override
  void dispose() {
    _brand.dispose();
    _model.dispose();
    _year.dispose();
    _color.dispose();
    _plate.dispose();
    super.dispose();
  }

  String? _req(String? v) {
    final l10n = ref.read(l10nProvider);
    return (v ?? '').trim().isEmpty ? l10n.addVehicleRequired : null;
  }

  String? _yearValidator(String? v) {
    final l10n = ref.read(l10nProvider);
    final n = int.tryParse((v ?? '').trim());
    if (n == null) return l10n.addVehicleYearInvalid;
    final now = DateTime.now().year;
    if (n < 1980 || n > now + 1) return l10n.addVehicleYearRange(1980, now + 1);
    return null;
  }

  Future<void> _save() async {
    final l10n = ref.read(l10nProvider);
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(vehiclesProvider.notifier).save(
            Vehicle(
              id: 'veh-${DateTime.now().millisecondsSinceEpoch}',
              brand: _brand.text.trim(),
              model: _model.text.trim(),
              year: int.parse(_year.text.trim()),
              color: _color.text.trim(),
              plate: _plate.text.trim().toUpperCase(),
              seats: _seats,
            ),
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.addVehicleSuccessSnackbar)),
      );
      context.pop();
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = l10n.addVehicleSaveError);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.addVehicleTitle)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacing24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _field(_brand, l10n.addVehicleBrand, l10n.addVehicleBrandHint,
                    _req,
                    cap: TextCapitalization.words),
                const SizedBox(height: 16),
                _field(_model, l10n.addVehicleModel, l10n.addVehicleModelHint,
                    _req,
                    cap: TextCapitalization.words),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _field(
                        _year,
                        l10n.addVehicleYear,
                        l10n.addVehicleYearHint,
                        _yearValidator,
                        keyboard: TextInputType.number,
                        formatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(4),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _field(_color, l10n.addVehicleColor,
                          l10n.addVehicleColorHint, _req,
                          cap: TextCapitalization.words),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _field(
                  _plate,
                  l10n.addVehiclePlate,
                  l10n.addVehiclePlateHint,
                  _req,
                  cap: TextCapitalization.characters,
                ),
                const SizedBox(height: 24),
                Text(l10n.addVehicleSeatsCount, style: _label()),
                const SizedBox(height: 8),
                _SeatStepper(
                  value: _seats,
                  enabled: !_saving,
                  onChanged: (v) => setState(() => _seats = v),
                  label: l10n.addVehicleSeatsAvailable,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 16),
                  Text(_error!, style: TextStyle(color: Colors.red.shade600)),
                ],
                const SizedBox(height: 28),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor: AlwaysStoppedAnimation(Colors.white),
                            ),
                          )
                        : Text(l10n.addVehicleSave),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController c,
    String label,
    String hint,
    String? Function(String?) validator, {
    TextInputType? keyboard,
    List<TextInputFormatter>? formatters,
    TextCapitalization cap = TextCapitalization.none,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: _label()),
        const SizedBox(height: 8),
        TextFormField(
          controller: c,
          enabled: !_saving,
          keyboardType: keyboard,
          inputFormatters: formatters,
          textCapitalization: cap,
          validator: validator,
          decoration: InputDecoration(hintText: hint),
        ),
      ],
    );
  }

  TextStyle _label() => const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.w600,
        color: AppTheme.navy,
      );
}

class _SeatStepper extends StatelessWidget {
  final int value;
  final bool enabled;
  final ValueChanged<int> onChanged;
  final String label;

  const _SeatStepper({
    required this.value,
    required this.enabled,
    required this.onChanged,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.slate200),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 16)),
          Row(
            children: [
              IconButton(
                onPressed:
                    enabled && value > 1 ? () => onChanged(value - 1) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$value',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(
                onPressed:
                    enabled && value < 7 ? () => onChanged(value + 1) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
