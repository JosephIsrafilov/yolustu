import 'package:flutter/material.dart';

import '../../core/utils/formatters.dart';

class PriceText extends StatelessWidget {
  const PriceText(
    this.value, {
    this.style,
    super.key,
  });

  final num value;
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return Text(
      formatAzn(value),
      style: style ?? Theme.of(context).textTheme.titleMedium,
    );
  }
}
