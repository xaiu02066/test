// theme.js —— 明亮温暖配色 + 共享样式
import { Platform, StyleSheet } from 'react-native'

export const colors = {
  bg: '#FFF8F0',
  bgElev: '#FFFFFF',
  bgSoft: '#FFEFD8',
  border: '#EADFC8',
  borderSoft: '#F3E9D3',

  text: '#3A2E22',
  textMute: '#8B7355',
  textDim: '#B8A48C',

  accent: '#E87D3B',
  accentSoft: 'rgba(232, 125, 59, 0.12)',
  accentLine: 'rgba(232, 125, 59, 0.35)',
  accentGradStart: '#FFB877',
  accentGradEnd: '#E87D3B',

  green: '#2D9F6A',
  greenSoft: 'rgba(45, 159, 106, 0.12)',
  red: '#DC604A',
  redSoft: 'rgba(220, 96, 74, 0.12)',
  blue: '#4A7DC4',
}

export const layout = {
  padding: 20,
  paddingSm: 12,
  radius: 14,
  radiusSm: 10,
  radiusLg: 22,
}

// 共享样式（不在组件内创建，避免内联对象）
export const sharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.bgElev,
    borderRadius: layout.radius,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#C8965A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
    }),
  },
  // 主按钮
  btnPrimary: {
    backgroundColor: colors.accent,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
    }),
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  btnGhost: {
    backgroundColor: colors.bgSoft,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  // 输入框
  input: {
    height: 50,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
  },
  label: {
    fontSize: 13,
    color: colors.textMute,
    marginBottom: 8,
  },
  // 头像
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  // 徽章
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
    overflow: 'hidden',
  },
  badgeAdmin: { backgroundColor: colors.accentSoft, color: colors.accent },
  badgeUser:  { backgroundColor: colors.bgSoft, color: colors.textMute },
  badgeOn:    { backgroundColor: colors.greenSoft, color: colors.green },
  badgeOff:   { backgroundColor: colors.redSoft, color: colors.red },
})
