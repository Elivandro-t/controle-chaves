import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function TabLayout() {
  return (
      <Tabs
      screenOptions={{
        headerShown: false,
        // Cor do ícone/texto quando selecionado (Azul Tech Corporativo)
        tabBarActiveTintColor: '#0284c7',
        // Cor do ícone/texto quando inativo (Cinza sutil)
        tabBarInactiveTintColor: '#94a3b8',

        // Estilização da barra de navegação inferior (Estilo Asian Minimalist)
        tabBarStyle: {
          backgroundColor: '#ffffff', // Fundo branco puro para sumir com o Dark Mode
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9', // Linha superior quase invisível
          height: 120, // Altura mais elegante e menos "gorda"
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 0, // Remove sombra pesada no Android
          shadowOpacity: 0, // Remove sombra no iOS
        },
        // Estilo dos textos (Fontes menores e mais "clean")
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Monitor',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "view-dashboard" : "view-dashboard-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="entregar"
        options={{
          title: 'Operação',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "key-chain" : "key-chain-variant"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Opções',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : null}>
              <MaterialCommunityIcons
                name={focused ? "clipboard-text-clock" : "clipboard-text-clock-outline"}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
    
  );
}

const styles = StyleSheet.create({
  // Efeito de micro-indicador no ícone (estilo dashboards coreanos)
  activeIconContainer: {
    backgroundColor: '#f0f9ff', // Um azul clarinho de fundo só no ícone ativo
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});