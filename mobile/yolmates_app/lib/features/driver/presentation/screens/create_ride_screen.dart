import 'package:flutter/material.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../shared/widgets/app_section_title.dart';

class CreateRideScreen extends StatefulWidget {
  const CreateRideScreen({super.key});

  @override
  State<CreateRideScreen> createState() => _CreateRideScreenState();
}

class _CreateRideScreenState extends State<CreateRideScreen> {
  final TextEditingController _fromController = TextEditingController(text: 'Bakı');
  final TextEditingController _toController = TextEditingController(text: 'Gəncə');
  final TextEditingController _priceController = TextEditingController(text: '18');
  final TextEditingController _seatsController = TextEditingController(text: '3');

  @override
  void dispose() {
    _fromController.dispose();
    _toController.dispose();
    _priceController.dispose();
    _seatsController.dispose();
    super.dispose();
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
              subtitle: 'Structured placeholder for the future driver ride wizard.',
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                children: <Widget>[
                  AppTextField(controller: _fromController, label: 'From city'),
                  const SizedBox(height: 12),
                  AppTextField(controller: _toController, label: 'To city'),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _priceController,
                    label: 'Price (AZN)',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  AppTextField(
                    controller: _seatsController,
                    label: 'Seats',
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Vehicle picker, map points, and submit request will be wired in the next stage.',
                  ),
                  const SizedBox(height: 16),
                  const AppButton(label: 'Publish ride', onPressed: null),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
