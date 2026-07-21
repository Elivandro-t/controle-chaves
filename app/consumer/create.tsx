import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image
} from 'react-native';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getUserId } from '@/services/storage';
import { createUsuarioConsumer } from '../../services/api';


export default function CreateConsumerScreen() {

  const router = useRouter();

  const cameraRef = useRef<any>(null);

  const [permission, requestPermission] = useCameraPermissions();

  const [cameraOpen, setCameraOpen] = useState(false);

  const [loading, setLoading] = useState(false);


  const [formData, setFormData] = useState({
    matricula:'',
    GmcoreId:'',
    nome:'',
    setor:'',
    filial:'',
    usuarioInsert:0,
    imagemFacial:''
  });



  function handleInputChange(
    field:keyof typeof formData,
    value:string
  ){
    setFormData(prev=>({
      ...prev,
      [field]:value
    }));
  }



  async function abrirCamera(){

    if(!permission?.granted){

      const result = await requestPermission();

      if(!result.granted){

        Alert.alert(
          "Permissão necessária",
          "Libere a câmera para cadastrar a biometria"
        );

        return;
      }
    }


    setCameraOpen(true);

  }


function removerFoto(){

 setFormData(prev=>({

   ...prev,

   imagemFacial:''

 }));

}
async function capturarFoto(){

  try{

    if(!cameraRef.current){
      return;
    }


    const foto = await cameraRef.current.takePictureAsync({
      base64:true,
      quality:0.8,
      skipProcessing:false
    });


    if(!foto?.base64){

      Alert.alert(
        "Erro",
        "Não foi possível capturar a imagem"
      );

      return;
    }


    const imagem =
    `data:image/jpeg;base64,${foto.base64}`;


    setFormData(prev=>({

      ...prev,

      imagemFacial: imagem

    }));


    setCameraOpen(false);



  }catch(error){

    console.log(error);

    Alert.alert(
      "Erro",
      "Falha ao capturar rosto"
    );

  }

}


  function validar(){

    const {
      matricula,
      GmcoreId,
      nome,
      setor,
      filial,
      imagemFacial

    }=formData;


    if(
      !matricula ||
      !GmcoreId ||
      !nome ||
      !setor ||
      !filial
    ){

      Alert.alert(
        "Erro",
        "Preencha todos os campos"
      );

      return false;
    }



    if(!imagemFacial){

      Alert.alert(
        "Erro",
        "Capture a biometria facial"
      );

      return false;
    }


    return true;

  }





  async function handleSubmit(){

    if(!validar())
      return;


    setLoading(true);


    try{


      const idUsuario = await getUserId();



      await createUsuarioConsumer({

        matricula:
        formData.matricula,

        GmcoreId:
        formData.GmcoreId,

        nome:
        formData.nome,

        setor:
        formData.setor,

        filial:
        Number(formData.filial),


        usuarioInsert:
        Number(idUsuario),


        imagemFacial:
      formData.imagemFacial

      });
      setLoading(false);



      Alert.alert(
        "Sucesso",
        "Usuário criado com biometria"
      );


      router.back();



    }catch(error:any){

  console.log("ERRO COMPLETO:", error);

  if (error.response) {

    // Erro vindo do Spring Boot
    console.log("STATUS:", error.response.status);
    console.log("DATA:", error.response.data);

    Alert.alert(
      "Erro",
      error.response.data.message ||
      error.response.data.error ||
      "Erro retornado pelo servidor"
    );

  } else if (error.request) {

    // Requisição saiu mas não teve resposta
    console.log("SEM RESPOSTA:", error.request);

    Alert.alert(
      "Erro",
      "Servidor não respondeu"
    );

  } else {

    // Erro antes de enviar
    console.log("ERRO:", error.message);

    Alert.alert(
      "Erro",
      error.message || "Falha ao criar usuário"
    );

  }

    }finally{

      setLoading(false);

    }

  }




  if(cameraOpen){

    return (

      <View style={{flex:1}}>

        <CameraView
          ref={cameraRef}
          style={{flex:1}}
          facing="front"
        />
       {
 formData.imagemFacial && (

<View style={styles.previewContainer}>


<Image

 source={{
   uri:formData.imagemFacial
 }}

 style={styles.previewImage}

/>


<Pressable

 style={styles.removeButton}

 onPress={removerFoto}

>

<MaterialCommunityIcons

name="delete"

size={25}

color="#fff"

/>

<Text style={styles.buttonText}>
 Remover
</Text>


</Pressable>


</View>

 )
}

        <Pressable
          style={styles.capture}
          onPress={capturarFoto}
        >

          <Text style={styles.buttonText}>
            Capturar rosto
          </Text>

        </Pressable>


      </View>

    );

  }





  return (

    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
    >


      <Pressable
        onPress={()=>router.back()}
      >

        <MaterialCommunityIcons
          name="chevron-left"
          size={30}
          color="#0a7ea4"
        />

      </Pressable>



      <Text style={styles.title}>
        Novo Usuário
      </Text>




      {
        [
          ["matricula","Matrícula"],
          ["GmcoreId","GMCore ID"],
          ["nome","Nome"],
          ["setor","Setor"],
          ["filial","Filial"]

        ].map(([key,label])=>(


          <View
            key={key}
            style={styles.field}
          >

            <Text>
              {label}
            </Text>


            <TextInput

              style={styles.input}

              value={
                formData[key as keyof typeof formData] as string
              }


              onChangeText={
                value=>
                handleInputChange(
                  key as keyof typeof formData,
                  value
                )
              }

            />

          </View>


        ))
      }



{!formData.imagemFacial && 
<Pressable
        style={styles.button}
        onPress={abrirCamera}
      >

        <Text style={styles.buttonText}>

          {
            formData.imagemFacial
            ?
            "Biometria capturada ✓"
            :
            "Capturar Face"
          }

        </Text>


      </Pressable>
}
      



      {
  formData.imagemFacial && (

    <View style={styles.previewContainer}>

      <View style={styles.imageWrapper}>

        <Image
          source={{
            uri: formData.imagemFacial
          }}
          style={styles.previewImage}
        />


        <Pressable
          style={styles.removeX}
          onPress={removerFoto}
        >

          <MaterialCommunityIcons
            name="close"
            size={18}
            color="#fff"
          />

        </Pressable>


      </View>

    </View>

  )
}



      <Pressable
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >

        {
          loading ?

          <ActivityIndicator color="#fff"/>

          :

          <Text style={styles.buttonText}>
            Criar Usuário
          </Text>

        }


      </Pressable>


    </ScrollView>

  );

}

const styles = StyleSheet.create({
  // --- Estrutura ---
  page: { flex: 1, backgroundColor: "#F8FAFC" },
  content: { padding: 24, gap: 20, paddingBottom: 50 },
  title: { fontSize: 28, fontWeight: "800", color: "#1E293B", marginBottom: 10 },

  // --- Inputs ---
  field: { gap: 8 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#334155",
  },

  // --- Botão de Envio (Quadrado com cantos arredondados) ---
  button: {
    backgroundColor: "#0EA5E9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 4,
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },

  // --- Botão de Captura (Circular e diferente do de envio) ---
  capture: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#0EA5E9",
    elevation: 10,
  },

  // --- Preview Quadrado (Formulário) ---
  previewContainer: { alignItems: "center", marginVertical: 10 },
  imageWrapper: { position: 'relative' },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 12, // Quadrado com bordas arredondadas
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },

  // --- Preview Quadrado (Dentro da Câmera) ---
  cameraPreviewWrapper: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "#FFF",
    borderRadius: 10,
  },
  cameraPreviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },

  // --- Botões de Remover ---
  removeX: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: "#FFF",
    elevation: 5,
  },
  removeButton: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 10,
  },
});