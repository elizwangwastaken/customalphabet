import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import * as opentype from "opentype.js";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SCALE = 12.5;

export default function DisplayPage() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [alphabetData, setAlphabetData] = useState<{ [key: string]: string }>({});
  const [vectorPaths, setVectorPaths] = useState<{ [key: string]: number[][][] }>({});
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("customAlphabet");
    if (stored) setAlphabetData(JSON.parse(stored));

    const storedPaths = localStorage.getItem("customAlphabetPaths");
    if (storedPaths) setVectorPaths(JSON.parse(storedPaths));
  }, []);

  const downloadFont = () => {
    const glyphs = [
      new opentype.Glyph({
        name: ".notdef",
        unicode: 0,
        advanceWidth: 650,
        path: new opentype.Path(),
      }),
    ];

    LETTERS.forEach((letter) => {
      const strokes = vectorPaths[letter] || [];
      const path = new opentype.Path();

      strokes.forEach((stroke) => {
        if (stroke.length === 0) return;
        path.moveTo(stroke[0][0] * SCALE, (80 - stroke[0][1]) * SCALE);
        for (let i = 1; i < stroke.length; i++) {
          path.lineTo(stroke[i][0] * SCALE, (80 - stroke[i][1]) * SCALE);
        }
      });

      glyphs.push(
        new opentype.Glyph({
          name: letter,
          unicode: letter.charCodeAt(0),
          advanceWidth: 1000,
          path,
        })
      );
    });

    const font = new opentype.Font({
      familyName: "CustomHandwriting",
      styleName: "Medium",
      unitsPerEm: 1000,
      ascender: 800,
      descender: -200,
      glyphs,
    });

    font.download();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const drawnCount = Object.keys(alphabetData).length;

  const renderText = () => {
    return inputText.toUpperCase().split("").map((char, idx) => {
      if (char === " ") {
        return <span key={idx} className="w-8 inline-block" />;
      }

      if (alphabetData[char]) {
        return (
          <div
            key={idx}
            className="inline-block w-[60px] h-[60px] mx-1 align-middle"
          >
            <img
              src={alphabetData[char]}
              alt={char}
              className="w-full h-full object-contain"
            />
          </div>
        );
      }

      return (
        <span key={idx} className="text-5xl text-gray-400 mx-1">
          {char}
        </span>
      );
    });
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{
        backgroundColor: "#D3D3D3",
        backgroundImage: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            rgba(255, 255, 255, 0.03) 2px,
            rgba(255, 255, 255, 0.03) 4px
          )
        `
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            ← Back to Edit
          </button>
          <button
            onClick={downloadFont}
            className="px-6 py-2 text-white transition-colors"
            style={{ backgroundColor: downloaded ? "#1a7f4b" : "#040c5b" }}
            onMouseEnter={e => {
              if (!downloaded) e.currentTarget.style.backgroundColor = "#030944";
            }}
            onMouseLeave={e => {
              if (!downloaded) e.currentTarget.style.backgroundColor = "#040c5b";
            }}
          >
            {downloaded
              ? "✓ Downloaded!"
              : `Download .OTF (${drawnCount}/26 letters)`}
          </button>
        </div>

        <h1 className="text-4xl text-center mb-12 text-black">
         test your custom alphabet
        </h1>

        <div className="mb-8">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="type something..."
            className="w-full px-6 py-4 text-2xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="bg-white p-12 rounded-lg shadow-lg min-h-[200px] flex items-center justify-center">
          <div className="flex flex-wrap gap-2 items-center justify-center">
            {inputText ? renderText() : (
              <span className="text-gray-400 text-2xl">
                start typing to see your alphabet...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
