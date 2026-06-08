import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/az_cities.dart';
import '../../../../core/network/api_result.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../../rides/data/rides_repository.dart';

class CreateRideScreen extends ConsumerStatefulWidget {
  const CreateRideScreen({super.key});

  @override
  ConsumerState<CreateRideScreen> createState() => _CreateRideScreenState();
}

class _CreateRideScreenState extends ConsumerState<CreateRideScreen> {
  final TextEditingController _priceController = TextEditingController(text: '18');
  final TextEditingController _seatsController = TextEditingController(text: '3');
  final TextEditingController _descriptionController = TextEditingController();

  String _fromCity = azCities.first;
  String _toCity = azCities.length > 1 ? azCities[1] : azCities.first;
  DateTime _departureDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _departureTime = const TimeOfDay(hour: 8, minute: 30);
  bool _isSubmitting = false;

  static const Map<String, Map<String, double>> _cityCoordinates =
      <String, Map<String, double>>{
        'Bakı': <String, double>{'lat': 40.4093, 'lon': 49.8671},
        'Gəncə': <String, double>{'lat': 40.6828, 'lon': 46.3606},
        'Lənkəran': <String, double>{'lat': 38.7543, 'lon': 48.8506},
        'Şəki': <String, double>{'lat': 41.1919, 'lon': 47.1706},
        'Quba': <String, double>{'lat': 41.3611, 'lon': 48.5134},
        'Şamaxı': <String, double>{'lat': 40.6314, 'lon': 48.6414},
        'Sumqayıt': <String, double>{'lat': 40.5897, 'lon': 49.6686},
        'Mingəçevir': <String, double>{'lat': 40.7640, 'lon': 47.0595},
      };

  @override
  void dispose() {
    _priceController.dispose();
    _seatsController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _selectDepartureDate() async {
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDate: _departureDate,
    );
    if (picked == null || !mounted) {
      return;
    }
    setState(() => _departureDate = picked);
  }

  Future<void> _selectDepartureTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _departureTime,
    );
    if (picked == null || !mounted) {
      return;
    }
    setState(() => _departureTime = picked);
  }

  Future<void> _submit() async {
    final seats = int.tryParse(_seatsController.text.trim());
    final price = double.tryParse(_priceController.text.trim());

    if (seats == null || seats < 1 || seats > 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Seats must be between 1 and 4.')),
      );
      return;
    }

    if (price == null || price <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Price must be positive.')),
      );
      return;
    }

    final origin = _cityCoordinates[_fromCity];
    final destination = _cityCoordinates[_toCity];
    if (origin == null || destination == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('City coordinates are unavailable.')),
      );
      return;
    }

    final departureTime = DateTime(
      _departureDate.year,
      _departureDate.month,
      _departureDate.day,
      _departureTime.hour,
      _departureTime.minute,
    );

    setState(() => _isSubmitting = true);
    final result = await ref.read(ridesRepositoryProvider).createRide(<String, dynamic>{
      'car_model': 'Mobile Driver Car',
      'departure_time': departureTime.toIso8601String(),
      'total_seats': seats,
      'available_seats': seats,
      'price_per_seat': price,
      'origin_city': _fromCity,
      'destination_city': _toCity,
      'description': _descriptionController.text.trim().isEmpty
          ? null
          : _descriptionController.text.trim(),
      'origin': origin,
      'destination': destination,
    });

    if (!mounted) {
      return;
    }

    setState(() => _isSubmitting = false);

    switch (result) {
      case ApiSuccess():
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ride published.')),
        );
        context.go('/driver/my-rides');
        return;
      case ApiFailure(:final message):
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(message)));
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create ride')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppConstants.screenPadding),
          children: <Widget>[
            const AppSectionTitle(
              'Create ride',
              subtitle:
                  'Minimal mobile ride publishing flow using the backend create ride contract.',
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                children: <Widget>[
                  DropdownButtonFormField<String>(
                    initialValue: _fromCity,
                    decoration: const InputDecoration(labelText: 'From city'),
                    items: azCities
                        .map(
                          (String city) => DropdownMenuItem<String>(
                            value: city,
                            child: Text(city),
                          ),
                        )
                        .toList(),
                    onChanged: (String? value) =>
                        setState(() => _fromCity = value ?? _fromCity),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _toCity,
                    decoration: const InputDecoration(labelText: 'To city'),
                    items: azCities
                        .map(
                          (String city) => DropdownMenuItem<String>(
                            value: city,
                            child: Text(city),
                          ),
                        )
                        .toList(),
                    onChanged: (String? value) =>
                        setState(() => _toCity = value ?? _toCity),
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Departure date'),
                    subtitle: Text(
                      '${_departureDate.day}.${_departureDate.month}.${_departureDate.year}',
                    ),
                    trailing: const Icon(Icons.calendar_today_outlined),
                    onTap: _selectDepartureDate,
                  ),
                  const SizedBox(height: 12),
                  ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Departure time'),
                    subtitle: Text(
                      '${_departureTime.hour.toString().padLeft(2, '0')}:${_departureTime.minute.toString().padLeft(2, '0')}',
                    ),
                    trailing: const Icon(Icons.schedule_outlined),
                    onTap: _selectDepartureTime,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _priceController,
                    label: 'Price per seat (AZN)',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _seatsController,
                    label: 'Seats',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _descriptionController,
                    label: 'Description (optional)',
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Vehicle ID is optional here. Backend creates a default vehicle if the driver has none.',
                  ),
                  const SizedBox(height: 16),
                  AppButton(
                    label: 'Publish ride',
                    isLoading: _isSubmitting,
                    onPressed: _isSubmitting ? null : _submit,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
