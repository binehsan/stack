import { Image, StyleSheet, View } from 'react-native';

// The Stack app's mark — a rounded-square gradient icon
// (frontend/assets/logo-mark.png, rasterized from the source artwork at
// assets/logo.svg, cropped tight to the artwork itself with none of the
// safe-zone padding the actual app-icon files carry). Ringed with a thin
// white border rather than sitting in a padded white box: the icon's own
// internal gradient is close enough to the app's live background gradient
// that, unringed, its edges all but disappear into it — the border is
// what makes it read as a distinct mark instead of a smudge sitting on a
// same-colored background. White is fixed (not a theme color) on purpose
// — it needs to contrast reliably against both the light and dark theme's
// gradients, which a theme-following color can't guarantee at every point
// along the gradient.
export default function Logo({ size = 64 }) {
  const styles = makeStyles(size);
  return (
    <View style={styles.frame}>
      <Image
        source={require('../../assets/logo-mark.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

function makeStyles(size) {
  return StyleSheet.create({
    frame: {
      width: size,
      height: size,
      borderRadius: size * 0.28,
      borderWidth: Math.max(2, size * 0.035),
      borderColor: '#FFFDF7',
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 3,
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });
}
