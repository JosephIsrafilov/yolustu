import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/az_cities.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_list_tile.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../../../shared/widgets/yolmates_logo.dart';
import '../../domain/ride_search_filters.dart';
import '../ride_search_date_utils.dart';

class RideSearchScreen extends StatefulWidget {
  const RideSearchScreen({super.key});

  @override
  State<RideSearchScreen> createState() => _RideSearchScreenState();
}

class _RideSearchScreenState extends State<RideSearchScreen> {
  final TextEditingController _dateController = TextEditingController();
  String _fromCity = azCities.first;
  String _toCity = azCities.length > 1 ? azCities[1] : azCities.first;
  int _seats = 1;
  late DateTime _date;

  @override
  void initState() {
    super.initState();
    _date = rideSearchInitialDate(null);
    _syncDateLabel();
  }

  @override
  void dispose() {
    _dateController.dispose();
    super.dispose();
  }

  void _syncDateLabel() {
    _dateController.text =
        '${_date.day.toString().padLeft(2, '0')}.${_date.month.toString().padLeft(2, '0')}.${_date.year}';
  }

  Future<void> _selectDate() async {
    final firstDate = rideSearchFirstDate();
    final selected = await showDatePicker(
      context: context,
      firstDate: firstDate,
      lastDate: rideSearchLastDate(),
      initialDate: rideSearchInitialDate(_date),
    );

    if (selected == null || !mounted) {
      return;
    }

    setState(() {
      _date = rideDateOnly(selected);
      _syncDateLabel();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final popularRoutes = azCities
        .skip(1)
        .take(3)
        .map((city) => (from: azCities.first, to: city))
        .toList();

    return ListView(
      padding: const EdgeInsets.all(AppConstants.screenPadding),
      children: <Widget>[
        const YolmatesLogo(
          title: 'Yolmates',
          subtitle: 'Yol yoldasi tap',
          compact: true,
        ),
        const SizedBox(height: 20),
        AppSectionTitle(
          l10n.searchRides,
          subtitle: 'Choose route, date, and seats to find real rides quickly.',
        ),
        const SizedBox(height: 12),
        AppCard(
          child: Column(
            children: <Widget>[
              DropdownButtonFormField<String>(
                initialValue: _fromCity,
                decoration: const InputDecoration(
                  labelText: 'From city',
                  prefixIcon: Icon(Icons.trip_origin_rounded),
                ),
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
                decoration: const InputDecoration(
                  labelText: 'To city',
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
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
              DropdownButtonFormField<int>(
                initialValue: _seats,
                decoration: const InputDecoration(
                  labelText: 'Seats',
                  prefixIcon: Icon(Icons.event_seat_outlined),
                ),
                items: const <DropdownMenuItem<int>>[
                  DropdownMenuItem<int>(value: 1, child: Text('1')),
                  DropdownMenuItem<int>(value: 2, child: Text('2')),
                  DropdownMenuItem<int>(value: 3, child: Text('3')),
                  DropdownMenuItem<int>(value: 4, child: Text('4')),
                ],
                onChanged: (int? value) =>
                    setState(() => _seats = value ?? _seats),
              ),
              const SizedBox(height: 12),
              AppTextField(
                controller: _dateController,
                label: 'Departure date',
                readOnly: true,
                prefixIcon: const Icon(Icons.calendar_today_outlined),
                suffixIcon: const Icon(Icons.keyboard_arrow_down_rounded),
                onTap: _selectDate,
              ),
              const SizedBox(height: 12),
              AppButton(
                label: l10n.continueLabel,
                onPressed: () {
                  final params = RideSearchFilters(
                    fromCity: _fromCity,
                    toCity: _toCity,
                    seats: _seats,
                    date: _date,
                  );
                  final uri = Uri(path: '/rides/results', queryParameters: <String, String>{
                    'from': params.fromCity ?? '',
                    'to': params.toCity ?? '',
                    'seats': '$_seats',
                    'date': _date.toIso8601String().split('T').first,
                  });
                  context.push(uri.toString());
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const AppSectionTitle(
          'Popular routes',
          subtitle: 'Tap once to prefill common city pairs.',
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: popularRoutes.map((route) {
            final isSelected =
                _fromCity == route.from && _toCity == route.to;
            return ChoiceChip(
              label: Text('${route.from} -> ${route.to}'),
              selected: isSelected,
              onSelected: (_) {
                setState(() {
                  _fromCity = route.from;
                  _toCity = route.to;
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 20),
        const AppCard(
          child: Column(
            children: <Widget>[
              AppListTile(
                title: 'Real API mode ready',
                subtitle: 'Search uses backend rides when API_MODE=real.',
                trailing: Icon(Icons.cloud_done_outlined),
              ),
              Divider(),
              AppListTile(
                title: 'Past dates blocked',
                subtitle: 'Date picker now clamps to today and later only.',
                trailing: Icon(Icons.verified_outlined),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
