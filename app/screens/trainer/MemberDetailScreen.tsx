import React from 'react'
import { View, Text } from 'react-native'
import { Colors, Typography } from '@/theme'

export function MemberDetailScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: Colors.textMuted, fontSize: Typography.base }}>MemberDetailScreen</Text>
    </View>
  )
}