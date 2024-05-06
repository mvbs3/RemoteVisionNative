import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const device = useCameraDevice("front");

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);
  if (!hasPermission) {
    return <div>Por facor aceitar permissao de camera</div>;
  }
  if (!device) {
    return <div>Device nao encontrado</div>;
  }
  const handleStartVideo = async () => {
    if (hasPermission && device) {
      setIsCameraEnabled(true);
      setIsButtonVisible(false);
    }
  };
  return (
    <View style={styles.container}>
      {isButtonVisible && (
        <Button
          title={isCameraEnabled ? "Capturar Imagem" : "Iniciar Câmera"}
          onPress={handleStartVideo}
        />
      )}
      <Text>Open up App.js to start working on your app!</Text>
      <StatusBar style="auto" />
      {isCameraEnabled && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
