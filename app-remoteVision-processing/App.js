import * as tf from "@tensorflow/tfjs";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { Camera } from "expo-camera";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  LogBox,
  Platform,
  StyleSheet,
  Button,
  View,
  Text,
} from "react-native";
import axios from "axios";

const TensorCamera = cameraWithTensors(Camera);

LogBox.ignoreAllLogs(true);

const { width, height } = Dimensions.get("window");

export default function App() {
  const fixedFaceLocations = [
    { x: 100, y: 100, w: 50, h: 60 },
    { x: 200, y: 150, w: 60, h: 60 },
    { x: 300, y: 200, w: 70, h: 70 },
  ];
  const [faceLocations, setFaceLocations] = useState(fixedFaceLocations);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);

  function handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      const imageTensor = await images.next().value;

      imageTensor.array().then(async (array) => {
        //console.log(array); // Isso imprimirá a matriz de valores no console
        //a = array;
        try {
          const response = await axios.post(
            "http://10.0.0.200:5001/processar_frames/",
            {
              frame: array,
            }
          );
          console.log(response.data.faces);
          setFaceLocations(response.data.faces);

          //console.log(response);
        } catch (error) {
          console.log("error");
        }
        //console.log(a);
      });

      // Aguarda 1 segundo antes de chamar a função loop novamente
      await new Promise((resolve) => setTimeout(resolve, 400));

      requestAnimationFrame(loop);
    };
    loop();
  }

  let textureDims;
  Platform.OS === "ios"
    ? (textureDims = { height: 1920, width: 1080 })
    : (textureDims = { height: 1200, width: 1600 });

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      await tf.ready();
      setModel(await cocoSsd.load());
    })();
  }, []);
  const handleStartVideo = async () => {
    setIsCameraEnabled(true);
    setIsButtonVisible(false);
  };
  const handleStopVideo = async () => {
    setIsCameraEnabled(false);
    setIsButtonVisible(true);
  };
  return (
    <View style={styles.container}>
      {isButtonVisible && (
        <View style={styles.container}>
          <View style={styles.buttonGroup}>
            <Button
              style={styles.button}
              title={"Cloud"}
              onPress={handleStartVideo}
            />
            <Button
              style={styles.button}
              title={"Mec"}
              onPress={handleStartVideo}
            />
          </View>
          <Text>Teste</Text>
        </View>
      )}
      <View style={styles.overlay}>
        {isCameraEnabled && (
          <TensorCamera
            // Standard Camera props
            style={styles.camera}
            type={Camera.Constants.Type.front}
            // Tensor related props
            cameraTextureHeight={textureDims.height}
            cameraTextureWidth={textureDims.width}
            resizeHeight={200}
            resizeWidth={152}
            resizeDepth={3}
            onReady={handleCameraStream}
            autorender={true}
            useCustomShadersToResize={false}
          ></TensorCamera>
        )}
        {isCameraEnabled && (
          <Button
            style={styles.buttonContainer}
            title={isCameraEnabled ? "Desligar Camera" : "Iniciar Câmera"}
            onPress={handleStopVideo}
          />
        )}
        {isCameraEnabled && (
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
                    (face.w * screenWidth) / 640,
                  top: (face.y * screenHeight) / 480,
                  width: face.w,
                  height: (face.h * screenHeight) / 480,
                  borderColor: "red",
                  borderWidth: 2,
                }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "black",
  },
  buttonGroup: {
    gap: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
});
