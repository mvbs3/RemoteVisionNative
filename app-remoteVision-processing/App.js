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

//const MecIP = "172.22.0.169/remoteComputation";
//const MecIP = "192.168.1.144:5001";
const MecIP = "10.0.0.200:5001";

//const CloudIP = "mazelinhuu.pythonanywhere.com";
const CloudIP = "20.197.224.24:5001";
const TensorCamera = cameraWithTensors(Camera);

LogBox.ignoreAllLogs(true);

const { width, height } = Dimensions.get("window");

export default function App() {
  const fixedFaceLocations = [
    { x: 100, y: 100, w: 50, h: 60 },
    { x: 100, y: 100, w: 60, h: 60 },
    { x: 100, y: 100, w: 70, h: 70 },
  ];
  const [faceLocations, setFaceLocations] = useState(fixedFaceLocations);
  const [emotions, setEmotions] = useState(["happy", "happy", "happy"]);
  const [emotionValues, setEmotionValues] = useState([1.0, 1.0, 1.0]);
  const [sample, setSample] = useState(0);

  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [isMecOrCloud, setIsMecOrCloud] = useState(" ");
  const [rttFrame, setRttFrame] = useState(0);
  const [latency, setLatency] = useState(0);
  const [timeProcess, setTimeProcess] = useState(0);
  let rttPing = 0;
  let rtt = 0;
  let sampleIterable = 0;
  const handlePing = async (tecnology) => {
    try {
      const startTime = new Date();
      if (tecnology == "MEC") {
        const res = await axios.get("http://" + MecIP + "/ping"); // Substitua 'seu_ip' pelo endereço IP do seu servidor Flask
      } else {
        const res = await axios.get("http://" + CloudIP + "/ping"); // Substitua 'seu_ip' pelo endereço IP do seu servidor Flask
      }

      const endTime = new Date();
      rttPing = endTime - startTime;
      setLatency(rttPing);
    } catch (error) {
      console.error(error);
      setLatency(-1);
    }
  };

  function handleCameraStream(images, updatePreview, gl) {
    const loop = async () => {
      const imageTensor = await images.next().value;

      //console.log("Tamanho do tensor de imagem em bytes:", imageTensor);

      //console.log(imageTensor);
      imageTensor.array().then(async (array) => {
        //const arrayString = JSON.stringify(array);
        //const arraySizeBytes = new Blob([arrayString]).size;
        //console.log("Tamanho do array em bytes:", imageTensor.size);
        //console.log(array); // Isso imprimirá a matriz de valores no console
        //a = array;
        try {
          if (isMecOrCloud == "MEC") {
            const sendInfo = {
              frame: array,
              sample: sampleIterable,
              csvSaver: {
                rttTimer: rtt,
                latencyTime: rttPing,
                packetSizeDown: imageTensor.size,
              },
            };
            const startTime = new Date();
            const response = await axios.post(
              //"http://192.168.70.2/remoteComputation/processar_frames",
              "http://" + MecIP + "/processar_emotion",

              sendInfo
            );
            const endTime = new Date();
            rtt = endTime - startTime;
            //console.log(rtt, response.data.emotion);
            setRttFrame(rtt);
            setTimeProcess(response.data.timeProcess);
            setFaceLocations(response.data.faces);
            setEmotions(response.data.emotion);
            setEmotionValues(response.data.emotionValue);

            console.log(response.data.faces);
          } else if (isMecOrCloud == "Cloud") {
            const sendInfo = {
              frame: array,
              sample: sampleIterable,
              csvSaver: {
                rttTimer: rtt,
                latencyTime: rttPing,
                packetSizeDown: imageTensor.size,
              },
            };
            const startTime = new Date();
            const response = await axios.post(
              "http://" + CloudIP + "/processar_emotion",
              sendInfo
            );
            const endTime = new Date();
            rtt = endTime - startTime;
            //console.log(rtt, response.data.emotion);
            setRttFrame(rtt);
            setTimeProcess(response.data.timeProcess);
            setFaceLocations(response.data.faces);
            setEmotions(response.data.emotion);
            setEmotionValues(response.data.emotionValue);

            console.log(response.data.faces);
          }

          //console.log(response);
        } catch (error) {
          console.log("error");
        }
        //console.log(a);
      });
      handlePing(isMecOrCloud);
      sampleIterable = sampleIterable + 1;
      setSample(sampleIterable);
      // Aguarda 1 segundo antes de chamar a função loop novamente
      await new Promise((resolve) => setTimeout(resolve, 500));

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
    })();
  }, []);
  const handleStartVideoMec = async () => {
    setIsCameraEnabled(true);
    setIsButtonVisible(false);
    setIsMecOrCloud("MEC");
  };
  const handleStartVideoCloud = async () => {
    setIsCameraEnabled(true);
    setIsButtonVisible(false);
    setIsMecOrCloud("Cloud");
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
              onPress={handleStartVideoCloud}
            />
            <Button
              style={styles.button}
              title={"MEC"}
              onPress={handleStartVideoMec}
            />
          </View>
          <Text>Selecione qual tecnologia você quer testar!</Text>
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
        <View style={styles.overlay2}>
          <Text style={styles.latencyText}>Frame RTT: {rttFrame}ms</Text>
          <Text style={styles.latencyText}>Latência: {latency}ms</Text>

          <Text style={styles.latencyText}>
            Tempo Processamento: {timeProcess}ms
          </Text>
          <Text style={styles.latencyText}>sample: {sample}</Text>
        </View>
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
                  position: "absolute",
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
              >
                <Text
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    marginTop: -20,
                  }}
                >
                  {emotions[index]} {emotionValues[index]}
                </Text>
              </View>
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

  overlay2: {
    position: "absolute", // Posicione a overlay acima da TensorCamera
    top: 40, // Ajuste a posição vertical conforme necessário
    left: 20,
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
