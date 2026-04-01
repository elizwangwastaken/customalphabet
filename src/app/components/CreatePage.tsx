import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function CreatePage() {
  const navigate = useNavigate();
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});
  const [isDrawing, setIsDrawing] = useState<string | null>(null);
  const [alphabetData, setAlphabetData] = useState<{ [key: string]: string }>({});
  const [history, setHistory] = useState<{ [key: string]: string[] }>({});
  const [lastDrawnLetter, setLastDrawnLetter] = useState<string | null>(null);
  const [vectorPaths, setVectorPaths] = useState<{ [key: string]: number[][][] }>({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    const storedImages = localStorage.getItem("customAlphabet");
    const storedPaths = localStorage.getItem("customAlphabetPaths");

    if (storedImages) {
      const data: { [key: string]: string } = JSON.parse(storedImages);
      setAlphabetData(data);
      Object.entries(data).forEach(([letter, dataUrl]) => {
        const canvas = canvasRefs.current[letter];
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0);
        img.src = dataUrl;
      });
    }

    if (storedPaths) {
      setVectorPaths(JSON.parse(storedPaths));
    }
  }, []);

  const startDrawing = (letter: string, e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(letter);
    setLastDrawnLetter(letter);
    const canvas = canvasRefs.current[letter];
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentState = canvas.toDataURL();
    setHistory((prev) => ({
      ...prev,
      [letter]: [...(prev[letter] || []), currentState],
    }));

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);

    setVectorPaths((prev) => ({
      ...prev,
      [letter]: [...(prev[letter] || []), [[x, y]]],
    }));
  };

  const draw = (letter: string, e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawing !== letter) return;

    const canvas = canvasRefs.current[letter];
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    setVectorPaths((prev) => {
      const strokes = [...(prev[letter] || [])];
      const current = [...strokes[strokes.length - 1]];
      current.push([x, y]);
      strokes[strokes.length - 1] = current;
      return { ...prev, [letter]: strokes };
    });
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRefs.current[isDrawing];
      if (canvas) {
        setAlphabetData((prev) => ({ ...prev, [isDrawing]: canvas.toDataURL() }));
      }
    }
    setIsDrawing(null);
  };

  const clearAll = () => {
    LETTERS.forEach((letter) => {
      const canvas = canvasRefs.current[letter];
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
    setAlphabetData({});
    setHistory({});
    setVectorPaths({});
    setLastDrawnLetter(null);
    setShowClearConfirm(false);
  };

  const handleUndo = () => {
    if (!lastDrawnLetter) return;
    const letterHistory = history[lastDrawnLetter] || [];
    if (letterHistory.length === 0) return;

    const canvas = canvasRefs.current[lastDrawnLetter];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prev = [...letterHistory];
    const snapshot = prev.pop();

    setHistory((h) => ({ ...h, [lastDrawnLetter]: prev }));
    setVectorPaths((p) => {
      const strokes = [...(p[lastDrawnLetter] || [])];
      strokes.pop();
      return { ...p, [lastDrawnLetter]: strokes };
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (snapshot && snapshot.length > 100) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setAlphabetData((a) => ({ ...a, [lastDrawnLetter!]: canvas.toDataURL() }));
      };
      img.src = snapshot;
    } else {
      setAlphabetData((a) => {
        const next = { ...a };
        delete next[lastDrawnLetter!];
        return next;
      });
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lastDrawnLetter, history]);

  const handleDone = () => {
    localStorage.setItem("customAlphabet", JSON.stringify(alphabetData));
    localStorage.setItem("customAlphabetPaths", JSON.stringify(vectorPaths));
    navigate("/display");
  };

  const previewChars = "create your alphabet".split("").map((char, idx) => {
    if (char === " ") return { char, hasDrawing: false, letter: " " };
    const upper = char.toUpperCase();
    return { char, hasDrawing: !!alphabetData[upper], letter: upper };
  });

  const drawnCount = Object.keys(alphabetData).length;

  return (
    <div
      className="min-h-screen p-8 pb-16 relative"
      style={{
        backgroundColor: "#D3D3D3",
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)
        `,
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <div className="flex flex-wrap gap-2 items-center justify-center text-3xl min-h-[60px]">
            {previewChars.map((item, idx) => {
              if (item.char === " ") return <span key={idx} className="w-4" />;
              if (item.hasDrawing) {
                return (
                  <div key={idx} className="inline-block w-[40px] h-[40px]">
                    <img src={alphabetData[item.letter]} alt={item.char} className="w-full h-full object-contain" />
                  </div>
                );
              }
              return <span key={idx} className="text-gray-400">{item.char}</span>;
            })}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-8">
          {LETTERS.map((letter) => (
            <div key={letter} className="flex flex-col items-center">
              <span className="text-sm mb-1 text-black">{letter}</span>
              <canvas
                ref={(el) => (canvasRefs.current[letter] = el)}
                width={80}
                height={80}
                className="bg-white cursor-crosshair transition-all"
                style={{
                  border: isDrawing === letter ? "3px solid #000" : "2px solid #000",
                  boxShadow: isDrawing === letter ? "0 0 0 2px #000" : "none",
                }}
                onMouseDown={(e) => startDrawing(letter, e)}
                onMouseMove={(e) => draw(letter, e)}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-3 items-center">
            <button
              onClick={handleUndo}
              className="px-8 py-3 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!lastDrawnLetter || (history[lastDrawnLetter] || []).length === 0}
            >
              Undo
            </button>

            {showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-black">erase everything?</span>
                <button
                  onClick={clearAll}
                  className="px-5 py-3 bg-black text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  yes, clear all
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-5 py-3 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors text-sm"
                >
                  cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-8 py-3 bg-white text-black border-2 border-black hover:bg-gray-100 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <span className="text-sm text-black tabular-nums">
            {drawnCount} / 26 letters drawn
          </span>

          <button
            onClick={handleDone}
            className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
