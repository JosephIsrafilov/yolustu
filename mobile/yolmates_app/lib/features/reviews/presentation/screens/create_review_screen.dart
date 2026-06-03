import 'package:flutter/material.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';

class CreateReviewScreen extends StatefulWidget {
  const CreateReviewScreen({super.key});

  @override
  State<CreateReviewScreen> createState() => _CreateReviewScreenState();
}

class _CreateReviewScreenState extends State<CreateReviewScreen> {
  final TextEditingController _commentController = TextEditingController();
  double _rating = 4.5;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create review')),
      body: ListView(
        padding: const EdgeInsets.all(AppConstants.screenPadding),
        children: <Widget>[
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text('Rating: ${_rating.toStringAsFixed(1)}'),
                Slider(
                  value: _rating,
                  min: 1,
                  max: 5,
                  divisions: 8,
                  onChanged: (double value) => setState(() => _rating = value),
                ),
                AppTextField(
                  controller: _commentController,
                  label: 'Comment',
                  maxLines: 4,
                ),
                const SizedBox(height: 16),
                const AppButton(label: 'Submit review', onPressed: null),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
