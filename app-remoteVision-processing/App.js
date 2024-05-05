import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import { View, Button, StyleSheet, Dimensions } from "react-native";
import {
  Camera,
  useFrameProcessor,
  CameraPosition,
} from "react-native-vision-camera";

const App = () => {
  const cameraRef = useRef(null);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;

  const [faceLocations, setFaceLocations] = useState([]);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);

  useEffect(() => {
    if (isCameraEnabled) {
      const unsubscribeProcessor = useFrameProcessor(async (frame) => {
        try {
          const base64Data = frame.base64;
          const response = await axios.post(
            "http://10.0.0.102:5001/processar_frames/",
            {
              frame: base64Data,
            }
          );
          setFaceLocations(response.data.faces);
        } catch (error) {
          console.error("Erro ao processar quadro:", error);
        }
      });
      return () => {
        unsubscribeProcessor();
      };
    }
  }, [isCameraEnabled]);

  const handleStartVideo = async () => {
    const permission = await Camera.requestCameraPermission();
    if (permission) {
      setIsCameraEnabled(true);
      setIsButtonVisible(false);
    } else {
      console.log("Permissão de câmera negada");
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

      {isCameraEnabled && (
        <Camera
          style={styles.camera}
          ref={cameraRef}
          position={CameraPosition.FRONT}
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
