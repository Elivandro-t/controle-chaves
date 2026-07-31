import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const OPCOES_TIPO = [
  { label: 'Vestiário Feminino', value: 'feminino' },
  { label: 'Vestiário Masculino', value: 'masculino' },
  { label: 'Portaria Secos', value: 'secos' },
  { label: 'Portaria Frios', value: 'frios' },
  { label: 'Portaria Hortifrúti', value: 'hort' },
];

export default function SelecaoModal({ visible, onClose, onSubmit }:any) {
  const [filial, setFilial] = useState('');
  const [tipo, setTipo] = useState('feminino');
  const [isSobreposicao, setIsSobreposicao] = useState(false);
  
  // Estado para controlar a abertura de um mini-modal ou lista de seleção do tipo
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const handleEnviar = () => {
    const dadosEnvio = {
      filial: filial,
      tipo: tipo,
      sobreposicao: isSobreposicao
    };
      console.log('Dados a serem enviados:', JSON.stringify(dadosEnvio));
    onSubmit(dadosEnvio);
    handleClose();
  };

  const handleClose = () => {
    setFilial('');
    setTipo('feminino');
    setIsSobreposicao(false);
    setDropdownVisible(false);
    onClose();
  };

  // Acha o label correspondente ao tipo selecionado para exibir no botão
  const tipoSelecionadoLabel = OPCOES_TIPO.find(item => item.value === tipo)?.label || 'Selecione o tipo';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Configurações de Acesso</Text>

          {/* Campo para Filial */}
          <Text style={styles.label}>Filial:</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite o nome ou número da filial"
            placeholderTextColor="#888"
            value={filial}
            onChangeText={setFilial}
          />

          {/* Seletor Customizado (Substituto do Picker nativo) */}
          <Text style={styles.label}>Tipo:</Text>
          <TouchableOpacity 
            style={styles.selectButton} 
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.selectButtonText}>{tipoSelecionadoLabel}</Text>
            <Text style={styles.arrow}>▼</Text>
          </TouchableOpacity>

          {/* Nova opção de Sobreposição */}
          <View style={styles.switchContainer}>
            <Text style={styles.labelSwitch}>Ativar Sobreposição?</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#81b2c4" }}
              thumbColor={isSobreposicao ? "#0a7ea4" : "#f4f3f4"}
              onValueChange={setIsSobreposicao}
              value={isSobreposicao}
            />
          </View>

          {/* Botões de Ação */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonCancel]} 
              onPress={handleClose}
            >
              <Text style={styles.textButton}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.buttonSubmit]} 
              onPress={handleEnviar}
            >
              <Text style={styles.textButton}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal interno para escolher as opções (Evita qualquer vazamento de memória) */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdownContent}>
            <Text style={styles.modalTitle}>Selecione o Tipo</Text>
            <FlatList
              data={OPCOES_TIPO}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    tipo === item.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setTipo(item.value);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    tipo === item.value && styles.dropdownItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity 
              style={styles.closeDropdownButton}
              onPress={() => setDropdownVisible(false)}
            >
              <Text style={styles.textButton}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  labelSwitch: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#333',
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fafafa',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#333',
  },
  arrow: {
    fontSize: 12,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonCancel: {
    backgroundColor: '#ccc',
  },
  buttonSubmit: {
    backgroundColor: '#0a7ea4',
  },
  textButton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  dropdownContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemSelected: {
    backgroundColor: '#e6f2f8',
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownItemTextSelected: {
    fontWeight: 'bold',
    color: '#0a7ea4',
  },
  closeDropdownButton: {
    backgroundColor: '#888',
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});