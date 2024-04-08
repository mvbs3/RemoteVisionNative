import React, { useRef, useState, useEffect } from "react";
import { Camera } from "expo-camera";
import axios from "axios";
import { View, Button, StyleSheet } from "react-native";
import { Dimensions } from "react-native";

const App = () => {
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const [faceLocations, setFaceLocations] = useState([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    let interval;
    if (isCameraEnabled) {
      interval = setInterval(() => {
        handleCapture();
        setFrameCount((prevCount) => prevCount + 1);
      }, 0.01); // Capturar a cada segundo
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isCameraEnabled]);

  const handleStartVideo = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === "granted") {
      setIsCameraEnabled(true);
      setIsButtonVisible(false);
    } else {
      console.log("Permissão de câmera negada");
    }
  };

  const handleCapture = async () => {
    try {
      const options = { quality: 0.5, base64: true };
      const uri = await cameraRef.current.takePictureAsync(options);

      // Processar a imagem capturada
      console.log("Imagem capturada com sucesso:");
      const base64Data = uri.base64;
      try {
        const response = await axios.post(
          "http://10.0.0.200:5001/processar_frames/",
          {
            frame: base64Data,
          }
        );

        setFaceLocations(response.data.faces);
      } catch (error) {
        console.error("Erro ao processar quadro:", error);
      }
    } catch (error) {
      // Lidar com erros de captura
      console.error("Erro ao capturar imagem:", error);
    }
  };

  return (
    <View style={styles.container}>
      {isButtonVisible && (
        <Button
          title={isCameraEnabled ? "Capturar Imagem" : "Iniciar Câmera"}
          onPress={isCameraEnabled ? handleCapture : handleStartVideo}
        />
      )}

      {isCameraEnabled && (
        <Camera
          style={styles.camera}
          ref={cameraRef}
          type={Camera.Constants.Type.front}
        />
      )}

      <View style={styles.overlay}>
        {/* Exibir retângulos sobre as faces detectadas */}
        {faceLocations.map((face, index) => (
          <View
            key={index}
            style={{
              position: "relative",
              left:
                screenWidth -
                (face.x * screenWidth) / 640 -
                (face.w * screenWidth) / 640 / 2,
              top:
                (face.y * screenHeight) / 480 +
                (face.h * screenHeight) / 480 / 2,
              width: (face.x * screenWidth) / 640,
              height: (face.h * screenHeight) / 480,
              borderColor: "red",
              borderWidth: 2,
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default App;
