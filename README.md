Dupliverse - iPod Library Prep Tool

This project is a tool designed to prepare an iPod library by converting audio files to a target format and bitrate, preserving metadata and cover art, and maintaining the folder structure from the input directory to the output directory. The tool avoids unnecessary conversions for already supported file formats (e.g., MP3, AAC).

Features

- Converts unsupported audio formats (e.g., FLAC) to a target format (e.g., ALAC).
- Copies supported audio formats (e.g., MP3, AAC) without conversion.
- Preserves metadata and cover art during conversion.
- Maintains the folder structure from the input directory to the output directory.
- Uses FFmpeg for audio conversion and - AtomicParsley for metadata and cover art handling.

Requirements

Node.js
FFmpeg
AtomicParsley

Setup

Clone the repository:

```bash
git clone https://github.com/yourusername/dupliverse.git
cd dupliverse
```
Install dependencies:

```bash
npm install
```

Create a .env file in the root directory with the following content:

```env
INPUT_FOLDER=./input
OUTPUT_FOLDER=./output
```

Ensure FFmpeg and AtomicParsley are installed. For Debian-based systems:

```bash
sudo apt-get install ffmpeg atomicparsley
```

Create input and output directories:

```bash
mkdir input output
```

Usage

Update the .env to the correct input and output locations.

Run the script:

```bash
npm start
```

Output files will be created in the output directory, preserving the original folder structure. Supported audio formats will be copied directly, while unsupported formats will be converted to the target format with metadata and cover art preserved.

Docker Usage

Build the Docker image:

```bash
docker-compose up --build
```

Run the Docker container:

```bash
docker-compose up

Place your audio files in the input directory and run the script as described above. The Docker container will handle the conversions and copying.
```

Contributing

Contributions are welcome! Feel free to submit a pull request or open an issue for any bugs or feature requests.
License

This project is licensed under the MIT License. See the LICENSE file for details.