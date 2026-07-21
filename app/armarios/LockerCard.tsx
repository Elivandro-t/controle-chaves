import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LockerCardProps {
  icon: React.ReactNode;
  title: string;
  livres: number;
  ocupadas: number;
  total: number;
}

export default function LockerCard({ icon, title, livres, ocupadas, total }: LockerCardProps) {
  return (
    <View style={styles.card}>
      {/* Container do Ícone (O ícone estilizado vem do componente pai) */}
      <View style={styles.iconContainer}>
        {icon}
      </View>

      {/* Informações Centrais */}
      <View style={styles.infoContainer}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        
        <View style={styles.statusRow}>
          {/* Badge de Livres */}
          <View style={[styles.badge, styles.badgeLivre]}>
            <View style={[styles.dot, styles.dotLivre]} />
            <Text style={styles.livresText}>{livres} livres</Text>
          </View>

          {/* Badge de Ocupadas */}
          <View style={[styles.badge, styles.badgeOcupado]}>
            <View style={[styles.dot, styles.dotOcupado]} />
            <Text style={styles.ocupadasText}>{ocupadas} ocupadas</Text>
          </View>
        </View>

        <Text style={styles.totalText}>{total} chaves no total</Text>
      </View>

      {/* Seta da Direita - Clean e discreta */}
      <View style={styles.arrowContainer}>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff', // Card branco para Light Mode
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd', // Borda sutil azul clara corporativa
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a', // Texto escuro de alto contraste
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8, // Espaçamento limpo entre os badges
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLivre: {
    backgroundColor: '#e8f5e9', // Fundo verde claro mais suave para light mode
  },
  badgeOcupado: {
    backgroundColor: '#fee2e2', // Fundo vermelho claro mais suave para light mode
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  dotLivre: {
    backgroundColor: '#15803d',
  },
  dotOcupado: {
    backgroundColor: '#b91c1c',
  },
  livresText: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
  },
  ocupadasText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '700',
  },
  totalText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  arrowContainer: {
    marginLeft: 8,
  },
});