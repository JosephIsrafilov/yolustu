import 'package:flutter/material.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';

class ProfileSetupScreen extends StatefulWidget {
  const ProfileSetupScreen({super.key});

  @override
  State<ProfileSetupScreen> createState() => _ProfileSetupScreenState();
}

class _ProfileSetupScreenState extends State<ProfileSetupScreen> {
  final TextEditingController _nameController = TextEditingController(
    text: 'Aysel Məmmədova',
  );
  final TextEditingController _cityController = TextEditingController(
    text: 'Bakı',
  );

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile setup')),
      body: Padding(
        padding: const EdgeInsets.all(AppConstants.screenPadding),
        child: Column(
          children: <Widget>[
            AppTextField(controller: _nameController, label: 'Full name'),
            const SizedBox(height: 12),
            AppTextField(controller: _cityController, label: 'City'),
            const SizedBox(height: 20),
            const AppButton(label: 'Save profile', onPressed: null),
          ],
        ),
      ),
    );
  }
}
