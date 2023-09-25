# wakeword-nodejs-demo

Based on vosk-api to detect wakeword.

## Installation

### 1. Install SoX

#### macOS (Homebrew)
```bash
brew install sox
```

#### Windows (Chocolatey)
```bash
choco install sox.portable
```

### 2. Install Project Dependencies

Navigate to the project's root directory and execute the following command:

```bash
cd ${project root}
npm install
```

## Choose a Model

1. Visit the [Alpha Cephei Vosk Models Page](https://alphacephei.com/vosk/models).
2. Download your preferred model and extract it into the `model` folder (create the folder if it doesn't exist).

## Run the Demo

### To Read from Microphone

Execute the following command to use your microphone as input:

```bash
npm run readmic
press ctrl + c to quit app
```

### To Read from a WAV File

Execute the following command, replacing `${path of your wav file}` with the actual path to your WAV file:

```bash
npm run readfile ${path of your wav file}
```

## License

This project is licensed under the [License Name](URL), see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Mention any acknowledgments or credits for libraries, tools, or resources used in your project.

