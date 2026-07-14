import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme.dart';

/// One entry in the bottom navigation bar.
class GymmaNavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  const GymmaNavItem(
      {required this.icon, required this.activeIcon, required this.label});
}

/// Shared bottom navigation bar used by both [GuestShell] and [MemberShell].
///
/// Previously this widget was copy-pasted between the two shells, so any
/// visual tweak had to be made twice. Keeping one implementation means the
/// guest and member tab bars can never silently drift apart.
class GymmaNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final List<GymmaNavItem> items;

  const GymmaNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    required this.items,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        boxShadow: [
          BoxShadow(
            color: AppColors.brandNavy.withOpacity(0.10),
            blurRadius: 20,
            offset: const Offset(0, -4),
          )
        ],
        border: const Border(
          top: BorderSide(color: AppColors.divider, width: 1),
        ),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 66,
          child: Row(
            children: items.asMap().entries.map((e) {
              final i = e.key;
              final item = e.value;
              final selected = currentIndex == i;
              return Expanded(
                child: GestureDetector(
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onTap(i);
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        curve: Curves.easeOut,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.brandCopper.withOpacity(0.12)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(AppRadius.full),
                        ),
                        child: Icon(
                          selected ? item.activeIcon : item.icon,
                          color: selected
                              ? AppColors.brandCopper
                              : AppColors.textSecondary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(height: 2),
                      AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight:
                              selected ? FontWeight.w700 : FontWeight.w500,
                          color: selected
                              ? AppColors.brandCopper
                              : AppColors.textSecondary,
                        ),
                        child: Text(item.label),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
