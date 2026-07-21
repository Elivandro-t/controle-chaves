import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  sub: string;
  nome: string;
  permissoes: any[];
  exp: number;
  iat: number;
}

export const descriptogradaToken  = async ()=>{
      const token = await AsyncStorage.getItem("authToken");
      const payload = jwtDecode<any>(token as any);

console.log(payload);
console.log(payload.nome);
console.log(payload?.permissoes);
return payload as any;
}
