import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Button, Dimensions } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  frameProcessor,
} from "react-native-vision-camera";

export default function App() {
  const fixedFaceLocations = [
    { x: 100, y: 100, w: 50, h: 50 },
    { x: 200, y: 150, w: 60, h: 60 },
    { x: 300, y: 200, w: 70, h: 70 },
  ];
  const { hasPermission, requestPermission } = useCameraPermission();
  const [faceLocations, setFaceLocations] = useState(fixedFaceLocations);
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
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
  const handleStopVideo = async () => {
    if (hasPermission && device) {
      setIsCameraEnabled(false);
      setIsButtonVisible(true);
    }
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
          <Text>Open up App.js to start working on your app!</Text>
          <StatusBar style="auto" />
        </View>
      )}
      <View style={styles.overlay}>
        {isCameraEnabled && (
          <Camera style={styles.camera} device={device} isActive={true} />
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
