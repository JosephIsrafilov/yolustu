import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/constants/az_cities.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../shared/widgets/app_list_tile.dart';
import '../../../../shared/widgets/app_section_title.dart';
import '../../domain/ride_search_filters.dart';

class RideSearchScreen extends StatefulWidget {
  const RideSearchScreen({super.key});

  @override
  State<RideSearchScreen> createState() => _RideSearchScreenState();
}

class _RideSearchScreenState extends State<RideSearchScreen> {
  String _fromCity = azCities.first;
  String _toCity = azCities.length > 1 ? azCities[1] : azCities.first;
  int _seats = 1;
  DateTime _date = DateTime(2026, 6, 5);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return ListView(
      padding: const EdgeInsets.all(AppConstants.screenPadding),
      children: <Widget>[
        AppSectionTitle(
          l10n.searchRides,
          subtitle: 'Search available rides by route, date, and seats.',
        ),
        const SizedBox(height: 12),
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
              DropdownButtonFormField<int>(
                initialValue: _seats,
                decoration: const InputDecoration(labelText: 'Seats'),
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
              AppListTile(
                title: 'Departure date',
                subtitle: '${_date.day}.${_date.month}.${_date.year}',
                trailing: const Icon(Icons.calendar_today_outlined),
                onTap: () async {
                  final selected = await showDatePicker(
                    context: context,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    initialDate: _date,
                  );
                  if (selected != null) {
                    setState(() => _date = selected);
                  }
                },
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
      ],
    );
  }
}
