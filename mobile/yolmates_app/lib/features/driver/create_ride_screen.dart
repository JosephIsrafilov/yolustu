import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/routes.dart';
import '../../core/theme.dart';
import '../../core/localization/app_localizations.dart';
import 'data/driver_ride.dart';
import 'data/driver_controller.dart';
import 'data/ai_pricing_repository.dart';
import '../../shared/widgets/map/route_map_view.dart';

/// Single-screen create-ride form (mock publish).
///
/// On publish creates a [DriverRide] via [driverRidesProvider] and routes to
/// "my rides". Kept a single screen to match the app's current simplicity.
class CreateRideScreen extends ConsumerStatefulWidget {
  const CreateRideScreen({super.key});

  @override
  ConsumerState<CreateRideScreen> createState() => _CreateRideScreenState();
}

class _CreateRideScreenState extends ConsumerState<CreateRideScreen> {
  final _formKey = GlobalKey<FormState>();
  final _price = TextEditingController();
  final _description = TextEditingController();

  String _from = AppConstants.cities.first;
  String _to = AppConstants.cities[1];
  DateTime _date = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _time = const TimeOfDay(hour: 8, minute: 0);
  int _seats = 3;
  bool _allowLuggage = true;
  bool _allowSmoking = false;
  bool _allowMusic = true;

  bool _publishing = false;
  String? _error;

  // AI Pricing
  bool _loadingAi = false;
  PricingSuggestionResponse? _aiSuggestion;
  String? _aiError;

  @override
  void dispose() {
    _price.dispose();
    _description.dispose();
    super.dispose();
  }

  String? _validatePrice(String? v) {
    final l10n = ref.read(l10nProvider);
    final value = (v ?? '').trim();
    if (value.isEmpty) return l10n.createRidePriceRequired;
    final parsed = double.tryParse(value);
    if (parsed == null || parsed <= 0) return l10n.createRidePriceInvalid;
    return null;
  }

  Future<void> _fetchAiPrice() async {
    final l10n = ref.read(l10nProvider);
    FocusScope.of(context).unfocus();
    if (_from == _to) {
      setState(() => _aiError = l10n.createRideSameLocationError);
      return;
    }
    setState(() {
      _loadingAi = true;
      _aiError = null;
      _aiSuggestion = null;
    });

    try {
      final req = PricingSuggestionRequest(
        origin: _from,
        destination: _to,
        departureTime: '${_time.hour.toString().padLeft(2, '0')}:${_time.minute.toString().padLeft(2, '0')}',
        departureDate: '${_date.year}-${_date.month.toString().padLeft(2, '0')}-${_date.day.toString().padLeft(2, '0')}',
        seatsTotal: _seats,
        language: 'az',
      );
      final repo = ref.read(aiPricingRepositoryProvider);
      final res = await repo.getSuggestion(req);
      if (mounted) {
        setState(() {
          _aiSuggestion = res;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _aiError = l10n.createRideAiError);
      }
    } finally {
      if (mounted) {
        setState(() => _loadingAi = false);
      }
    }
  }

  Future<void> _publish() async {
    final l10n = ref.read(l10nProvider);
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    if (_from == _to) {
      setState(() => _error = l10n.createRideSameLocationError);
      return;
    }

    setState(() {
      _publishing = true;
      _error = null;
    });

    try {
      final ride = DriverRide(
        id: 'dr-${DateTime.now().millisecondsSinceEpoch}',
        fromCity: _from,
        toCity: _to,
        departureTime: DateTime(
            _date.year, _date.month, _date.day, _time.hour, _time.minute),
        seats: _seats,
        pricePerSeat: double.parse(_price.text.trim()),
        allowLuggage: _allowLuggage,
        allowSmoking: _allowSmoking,
        allowMusic: _allowMusic,
        description: _description.text.trim(),
        status: DriverRideStatus.upcoming,
      );
      await ref.read(driverRidesProvider.notifier).publish(ride);
      if (!mounted) return;
      await _showSuccess();
      if (!mounted) return;
      context.go(AppRoutes.myRides);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = l10n.createRidePublishError);
    } finally {
      if (mounted) setState(() => _publishing = false);
    }
  }

  Future<void> _showSuccess() {
    final l10n = ref.read(l10nProvider);
    return showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: AppTheme.tealDark, size: 48),
            const SizedBox(height: 16),
            Text(l10n.createRideSuccessTitle,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text(l10n.createRideSuccessMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.slate500)),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(l10n.commonClose),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = ref.watch(l10nProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.createRideTitle)),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(AppConstants.spacing24),
            children: [
              _label(l10n.createRideFrom),
              _CityDropdown(
                value: _from,
                onChanged: (v) => setState(() => _from = v),
              ),
              const SizedBox(height: 16),
              _label(l10n.createRideTo),
              _CityDropdown(
                value: _to,
                onChanged: (v) => setState(() => _to = v),
              ),
              const SizedBox(height: 16),
              Container(
                height: 180,
                width: double.infinity,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.slate200),
                ),
                clipBehavior: Clip.antiAlias,
                child: RouteMapView(
                  origin: _from,
                  destination: _to,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _PickerTile(
                      icon: Icons.calendar_today,
                      label: l10n.createRideDate,
                      value: '${_date.day}.${_date.month}.${_date.year}',
                      onTap: _pickDate,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _PickerTile(
                      icon: Icons.access_time,
                      label: l10n.createRideTime,
                      value: _time.format(context),
                      onTap: _pickTime,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _label(l10n.createRideSeats),
              _SeatsStepper(
                seats: _seats,
                onChanged: (s) => setState(() => _seats = s),
                label: l10n.createRideSeatsLabel,
              ),
              const SizedBox(height: 16),
              _label(l10n.createRidePrice),
              TextFormField(
                controller: _price,
                enabled: !_publishing,
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                validator: _validatePrice,
                decoration: InputDecoration(hintText: l10n.createRidePriceHint),
              ),
              const SizedBox(height: 16),

              // AI Suggestion UI
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.teal.withValues(alpha: 0.05),
                  border: Border.all(color: AppTheme.teal.withValues(alpha: 0.3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.auto_awesome, color: AppTheme.tealDark, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            l10n.createRideAiTitle,
                            style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.navy),
                          ),
                        ),
                        if (!_loadingAi && _aiSuggestion == null)
                          TextButton(
                            onPressed: _fetchAiPrice,
                            style: TextButton.styleFrom(
                              visualDensity: VisualDensity.compact,
                              foregroundColor: AppTheme.tealDark,
                            ),
                            child: Text(l10n.createRideAiGetSuggestion),
                          ),
                      ],
                    ),
                    if (_loadingAi)
                      const Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Center(
                          child: SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(AppTheme.teal)),
                          )
                        ),
                      ),
                    if (_aiError != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Row(
                          children: [
                            Icon(Icons.error_outline, size: 16, color: Colors.red.shade600),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_aiError!, style: TextStyle(color: Colors.red.shade600, fontSize: 13))),
                            TextButton(
                              onPressed: _fetchAiPrice,
                              child: Text(l10n.createRideAiRetry, style: const TextStyle(fontSize: 13)),
                            )
                          ],
                        ),
                      ),
                    if (_aiSuggestion != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${l10n.createRideAiSuggestionLabel} ${_aiSuggestion!.suggestedPrice} AZN',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.tealDark),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _aiSuggestion!.reasoning,
                              style: const TextStyle(color: AppTheme.slate500, fontSize: 13),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () {
                                  setState(() {
                                    _price.text = _aiSuggestion!.suggestedPrice.toString();
                                    _error = null;
                                  });
                                  // Re-validate field after setting text
                                  _formKey.currentState?.validate();
                                },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppTheme.tealDark,
                                  side: const BorderSide(color: AppTheme.tealDark),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: Text(l10n.createRideAiUsePrice),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              _label(l10n.createRidePreferences),
              _PrefSwitch(
                title: l10n.createRideLuggage,
                value: _allowLuggage,
                onChanged: (v) => setState(() => _allowLuggage = v),
              ),
              _PrefSwitch(
                title: l10n.createRideSmoking,
                value: _allowSmoking,
                onChanged: (v) => setState(() => _allowSmoking = v),
              ),
              _PrefSwitch(
                title: l10n.createRideMusic,
                value: _allowMusic,
                onChanged: (v) => setState(() => _allowMusic = v),
              ),
              const SizedBox(height: 16),
              _label(l10n.createRideNotes),
              TextFormField(
                controller: _description,
                enabled: !_publishing,
                maxLines: 3,
                decoration: InputDecoration(
                    hintText: l10n.createRideNotesHint),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(Icons.error_outline,
                        size: 18, color: Colors.red.shade600),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_error!,
                          style: TextStyle(color: Colors.red.shade600)),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 28),
              SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _publishing ? null : _publish,
                  child: _publishing
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation(Colors.white),
                          ),
                        )
                      : Text(l10n.createRidePublish),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 90)),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: _time);
    if (picked != null) setState(() => _time = picked);
  }

  Widget _label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(text,
            style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppTheme.navy)),
      );
}

class _CityDropdown extends StatelessWidget {
  final String value;
  final ValueChanged<String> onChanged;

  const _CityDropdown({required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: const InputDecoration(prefixIcon: Icon(Icons.location_on)),
      items: AppConstants.cities
          .map((c) => DropdownMenuItem(value: c, child: Text(c)))
          .toList(),
      onChanged: (v) {
        if (v != null) onChanged(v);
      },
    );
  }
}

class _PickerTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback onTap;

  const _PickerTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.slate200),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppTheme.slate500),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(fontSize: 11, color: AppTheme.slate500)),
                Text(value,
                    style: const TextStyle(fontWeight: FontWeight.w600)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SeatsStepper extends StatelessWidget {
  final int seats;
  final ValueChanged<int> onChanged;
  final String label;

  const _SeatsStepper({required this.seats, required this.onChanged, required this.label});

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
                onPressed: seats > 1 ? () => onChanged(seats - 1) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$seats',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(
                onPressed: seats < 4 ? () => onChanged(seats + 1) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PrefSwitch extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _PrefSwitch({
    required this.title,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile.adaptive(
      contentPadding: EdgeInsets.zero,
      title: Text(title, style: const TextStyle(fontSize: 15)),
      value: value,
      activeThumbColor: AppTheme.teal,
      onChanged: onChanged,
    );
  }
}
