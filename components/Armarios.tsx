import React from "react";
import { Pressable, View, StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BlocoUnidade {
  id: number;
  tipo: string;
  armariosUnidade?: Array<{
    status: string;
    disponivel?: boolean;
  }>;
}

interface ArmarioComponenteProps {
  blocos: BlocoUnidade[];
}

export const ArmarioComponete = ({ blocos }: ArmarioComponenteProps) => {
  const router = useRouter();
  
  const handleCardPress = (blocoId: number, tipo: string) => {
    router.push({
      pathname: `/armarios/ArmariosScreen` as any,
      params: {
        armarioId: String(blocoId),
        tipo: String(tipo),
      },
    });
  };

  const formatarNomeTipo = (tipo: string) => {
    if (!tipo) return '';
    return tipo
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
  };

  // Ícones e cores de fundo premium para a bola do ícone (baseado na imagem)
  const obterConfiguracaoPorTipo = (tipo: string) => {
    switch (tipo?.toUpperCase()) {
      case 'VESTIARIO_MASCULINO': 
        return {
          icon: 'gender-male',
          color: '#0284c7',
          bgColor: '#e0f2fe'
        };
      case 'VESTIARIO_FEMININO': 
        return {
          icon: 'gender-female',
          color: '#db2777',
          bgColor: '#fce7f3'
        };
      case 'PORTARIA_FRIOS': 
        return {
          icon: 'snowflake',
          color: '#2563eb',
          bgColor: '#dbeafe'
        };
      case 'PORTARIA_SECOS': 
        return {
          icon: 'package-variant-closed',
          color: '#b45309',
          bgColor: '#fef3c7'
        };
      case 'HORTIFRUTI': 
        return {
          icon: 'food-apple-outline',
          color: '#16a34a',
          bgColor: '#dcfce7'
        };
      default: 
        return {
          icon: 'door-closed',
          color: '#475569',
          bgColor: '#f1f5f9'
        };
    }
  };

  if (!blocos || !Array.isArray(blocos)) {
    return null;
  }

  return (
    <View style={styles.container}>
      {blocos.map((bloco) => {
        const total = bloco.armariosUnidade?.length || 0;
        const livres = bloco.armariosUnidade?.filter(
          (a) => a.status === 'LIVRE' || a.disponivel
        ).length || 0;
        const ocupadas = bloco.armariosUnidade?.filter(
          (a) => a.status === 'OCUPADO'
        ).length || 0;

        const config = obterConfiguracaoPorTipo(bloco.tipo);

        return (
          <Pressable
            key={bloco.id}
            onPress={() => handleCardPress(bloco.id, bloco.tipo)}
            style={({ pressed }) => [
              styles.cardCard,
              { transform: [{ scale: pressed ? 0.99 : 1 }] }
            ]}
          >
            {/* Círculo do Ícone do Tipo */}
            <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
              <MaterialCommunityIcons name={config.icon as any} size={24} color={config.color} />
            </View>

            {/* Informações centrais */}
            <View style={styles.infoContainer}>
              <Text style={styles.titleText}>{formatarNomeTipo(bloco.tipo)}</Text>
              
              {/* Badges de Status (Exatamente como o mockup) */}
              <View style={styles.badgeRow}>
                <View style={styles.badgeLivre}>
                  <Text style={styles.badgeLivreText}>{livres} livres</Text>
                </View>
                <View style={styles.badgeOcupado}>
                  <Text style={styles.badgeOcupadoText}>{ocupadas} ocupadas</Text>
                </View>
                <Text style={styles.totalText}>•  {total} total</Text>
              </View>
            </View>

            {/* Seta discreta indicando clique */}
            <MaterialCommunityIcons name="chevron-right" size={18} color="#cbd5e1" />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 4,
  },
  cardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeLivre: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLivreText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeOcupado: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOcupadoText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
  },
  totalText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginLeft: 2,
  },
});