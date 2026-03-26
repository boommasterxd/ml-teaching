/**
 * Landing page that provides an overview of the AI Image Recognition application,
 * featuring interactive visualizations and educational content.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Camera, Zap, ArrowRight, Dog, Cat, Users, ImagePlus, Lightbulb, Car, Smartphone, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'KI Bilderkennung für Schüler';
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-zinc-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="/ada-logo.png" 
            alt="Ada Lovelace Projekt Logo" 
            className="h-10 w-auto object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-lg text-zinc-800 hidden sm:block">KI Bilderkennung</span>
        </a>
      </nav>

      {/* Hero Section */}
      <header className="bg-white border-b border-zinc-200 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-2xl mb-6">
            <Brain className="w-10 h-10" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6">
            Entdecke <span className="text-red-600 font-bold">Künstliche Intelligenz</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto mb-10">
            Lerne spielerisch, wie Computer sehen können. Trainiere dein eigenes Bilderkennungsmodell direkt im Browser. Keine Programmierkenntnisse erforderlich!
          </p>
          <button
            onClick={() => navigate('/lernen')}
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-red-600 rounded-full hover:bg-red-700 transition-colors shadow-lg shadow-red-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30"
          >
            Jetzt ausprobieren <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* 3 Steps Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-16">In 3 Schritten zur eigenen KI</h2>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">1</div>
            <Camera className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Daten sammeln</h3>
            <p className="text-zinc-600">Nutze deine Kamera, um Bilder für verschiedene Kategorien aufzunehmen. Zeige der KI, was sie lernen soll.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">2</div>
            <Brain className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Modell trainieren</h3>
            <p className="text-zinc-600">Die App analysiert deine Bilder und trainiert ein neuronales Netz, um die Muster zu erkennen.</p>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 text-center relative">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold" aria-hidden="true">3</div>
            <Zap className="w-10 h-10 mx-auto text-zinc-400 mb-4" aria-hidden="true" />
            <h3 className="text-xl font-semibold mb-3">Ausprobieren</h3>
            <p className="text-zinc-600">Teste dein Modell in Echtzeit! Halte Objekte in die Kamera und sieh, wie die KI sie klassifiziert.</p>
          </div>
        </div>
      </section>

      {/* Interactive Neural Net Visualization */}
      <section className="py-20 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Wie lernt ein Computer?</h2>
            <p className="text-zinc-400 max-w-3xl mx-auto text-lg">
              Um zu verstehen, was er sieht, nutzt ein Computer ein sogenanntes künstliches neuronales Netz. 
              Das ist eine Technik, die sich an der Arbeitsweise unseres Gehirns orientiert. 
              Ein solches Netz besteht aus Schichten (Layers) von "Neuronen". 
              Bilder werden an die <strong><span lang="en">Input Layer</span></strong> übergeben. Die <strong><span lang="en">Hidden Layers</span></strong> erkennen Muster (wie Kanten, Formen, Ohren).
              Die <strong><span lang="en">Output Layer</span></strong> liefert das finale Ergebnis. Probier es aus!
            </p>
          </div>

          <NeuralNetViz />
        </div>
      </section>

      {/* Explanation Section for Students */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-zinc-900">Wie funktioniert das hier genau?</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Ein Blick unter die Haube – einfach erklärt für dich! Wir nutzen zwei clevere Techniken, die wie ein Team zusammenarbeiten, damit dein Computer sehen lernt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            {/* NN Explanation */}
            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110" aria-hidden="true" />
              <Brain className="w-12 h-12 text-red-500 mb-6 relative z-10" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-4 text-zinc-800 relative z-10">1. Das "Auge" <br/><span className="text-red-600 text-lg">Neuronales Netz (<span lang="en">MobileNet</span>)</span></h3>
              <p className="text-zinc-600 leading-relaxed relative z-10">
                Stell dir vor, du hast ein riesiges digitales Gehirn, das schon Millionen von Bildern gesehen hat. In unserer App nutzen wir ein vorgefertigtes <strong>Neuronales Netz</strong>. Es ist wie ein Auge, das bereits gelernt hat, grundlegende Dinge wie Kanten, Farben und Formen zu erkennen. 
                <br/><br/>
                Wenn du ein Bild mit der Kamera aufnimmst, schaut sich dieses Netz das Bild an und erstellt einen einzigartigen <strong>"Fingerabdruck"</strong> (eine lange Liste aus Zahlen) davon.
              </p>
            </div>

            {/* KNN Explanation */}
            <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-100 relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110" aria-hidden="true" />
              <Users className="w-12 h-12 text-blue-500 mb-6 relative z-10" aria-hidden="true" />
              <h3 className="text-2xl font-bold mb-4 text-zinc-800 relative z-10">2. Der "Entscheider" <br/><span className="text-blue-600 text-lg"><span lang="en">K-Nearest Neighbors (KNN)</span></span></h3>
              <p className="text-zinc-600 leading-relaxed relative z-10">
                <span lang="en">KNN</span> steht für <strong><span lang="en">K-Nearest Neighbors</span></strong> (auf Deutsch: die K-nächsten Nachbarn). Stell dir vor, du bist neu in einer Schule und suchst Freunde. Du schaust, wer ähnliche Hobbys hat wie du. Genau das macht KNN! 
                <br/><br/>
                Wenn die Kamera ein neues Bild sieht, vergleicht KNN den Fingerabdruck dieses Bildes mit allen Bildern, die du vorher beim Training aufgenommen hast. Es sucht die Bilder, die am ähnlichsten sind (die "Nachbarn"). Wenn die meisten dieser Nachbarn zur Klasse "Hund" gehören, sagt der Computer: "Das ist ein Hund!"
              </p>
            </div>
          </div>

          {/* Transfer Learning Explanation */}
          <div className="mt-12 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 sm:p-12 rounded-3xl text-white text-center relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} aria-hidden="true"></div>
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-6 relative z-10" aria-hidden="true" />
            <h3 className="text-2xl font-bold mb-4 relative z-10">Warum geht das so schnell? (<span lang="en">Transfer Learning</span>)</h3>
            <p className="text-zinc-300 leading-relaxed max-w-3xl mx-auto relative z-10 text-lg">
              Normalerweise braucht eine KI Tausende von Bildern und tagelanges Training. Wir nutzen einen Trick namens <strong><span lang="en">Transfer Learning</span></strong>. Das Neuronale Netz (das Auge) bringt schon sein ganzes Vorwissen mit. Der KNN-Algorithmus (der Entscheider) merkt sich einfach nur noch deine paar neuen Bilder und vergleicht sie blitzschnell. So lernt dein Modell in Sekunden direkt hier in deinem Browser!
            </p>
          </div>
        </div>
      </section>

      {/* Tips for a Smart Model */}
      <section className="py-20 bg-zinc-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-zinc-900">Tipps für ein schlaues Modell</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Damit dein Computer nicht durcheinanderkommt, braucht er gutes Training. Hier sind drei goldene Regeln für perfekte Bilder:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <ImagePlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">1. Viele Bilder</h3>
              <p className="text-zinc-600">
                Je mehr Bilder du aufnimmst, desto besser! Ein Baby lernt auch nicht nach einem einzigen Mal, wie ein Hund aussieht. Versuche mindestens 15-20 Bilder pro Klasse zu machen.
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">2. Verschiedene Winkel</h3>
              <p className="text-zinc-600">
                Zeige das Objekt von vorne, von der Seite, von oben und von unten. Wenn der Computer eine Tasse nur von oben kennt, erkennt er sie von der Seite vielleicht nicht wieder!
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6" aria-hidden="true">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800 break-words hyphens-auto" lang="de">3. Unterschiedliches Licht</h3>
              <p className="text-zinc-600">
                Achte darauf, dass der Hintergrund nicht immer gleich ist und das Licht mal heller, mal dunkler ist. Sonst lernt der Computer vielleicht nur dein Zimmer kennen, aber nicht das Objekt!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real World Examples */}
      <section className="py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-6 text-zinc-900">Wo findest du das im Alltag?</h2>
            <p className="text-zinc-600 max-w-3xl mx-auto text-lg">
              Bilderkennung ist keine Zukunftsmusik mehr. Du nutzt sie wahrscheinlich schon jeden Tag!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Smartphone className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Face ID & Filter</h3>
              <p className="text-zinc-600">
                Dein Handy entsperrt sich, weil es dein Gesicht erkennt. Und lustige Snapchat-Filter wissen genau, wo deine Nase und Augen sind.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Car className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Selbstfahrende Autos</h3>
              <p className="text-zinc-600">
                Autos nutzen Kameras und KI, um Straßenschilder, Fußgänger und andere Autos zu erkennen, damit sie sicher fahren können.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6">
              <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6" aria-hidden="true">
                <Stethoscope className="w-10 h-10 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-zinc-800">Medizin</h3>
              <p className="text-zinc-600">
                Ärzte nutzen Bilderkennung, um auf Röntgenbildern Krankheiten viel schneller und genauer zu entdecken als das menschliche Auge.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Final Call to Action */}
      <section className="py-24 bg-zinc-900 text-white px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} aria-hidden="true"></div>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Bereit für dein eigenes Experiment?</h2>
          <p className="text-xl text-zinc-400 mb-10">
            Du hast gelernt, wie KI sieht und entscheidet. Jetzt ist es Zeit, dein eigenes Modell zu trainieren und auszuprobieren!
          </p>
          <button
            onClick={() => navigate('/lernen')}
            className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-red-600 rounded-full hover:bg-red-700 transition-all hover:scale-105 shadow-xl shadow-red-900/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-600/30"
          >
            Jetzt ausprobieren <ArrowRight className="ml-2 w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Collaboration Section */}
      <section className="bg-white py-16 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <p className="text-zinc-600 mb-6 font-medium">
            Entwickelt in Zusammenarbeit mit dem
          </p>
          <a
            href="https://ada-lovelace.de/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4 hover:opacity-90 transition-opacity"
          >
            <img
              src="/ada-logo.png"
              alt=""
              aria-hidden="true"
              className="h-24 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="text-zinc-600 font-bold border-b border-transparent group-hover:border-zinc-300 transition-all">
              Ada-Lovelace-Projekt
            </span>
          </a>        </div>
      </section>
      </div>
      );
      }
function NeuralNetViz() {
  const [activeSignal, setActiveSignal] = useState<'dog' | 'cat' | null>(null);
  const [animStep, setAnimStep] = useState(-1);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const triggerAnimation = (type: 'dog' | 'cat') => {
    if (animating) return;
    setAnimating(true);
    setActiveSignal(type);
    setResult(null);
    setAnimStep(0);

    const stepDuration = 400; // ms

    setTimeout(() => setAnimStep(1), stepDuration * 1);
    setTimeout(() => setAnimStep(2), stepDuration * 2);
    setTimeout(() => setAnimStep(3), stepDuration * 3);
    setTimeout(() => setAnimStep(4), stepDuration * 4);
    setTimeout(() => setAnimStep(5), stepDuration * 5);
    setTimeout(() => setAnimStep(6), stepDuration * 6);
    setTimeout(() => {
      setAnimStep(7);
      setResult(type === 'dog' ? 'Hund erkannt (98%)' : 'Katze erkannt (95%)');
      setAnimating(false);
    }, stepDuration * 7);
  };

  // Node configuration
  const layers = [
    { id: 'input', nodes: 4, label: 'Input' },
    { id: 'hidden1', nodes: 6, label: 'Hidden 1' },
    { id: 'hidden2', nodes: 6, label: 'Hidden 2' },
    { id: 'output', nodes: 2, label: 'Output' },
  ];

  const getNodeY = (totalNodes: number, index: number) => {
    const nodeHeight = 24;
    const gap = 16;
    const totalHeight = totalNodes * nodeHeight + (totalNodes - 1) * gap;
    const startY = (320 - totalHeight) / 2;
    return startY + index * (nodeHeight + gap) + nodeHeight / 2;
  };

  return (
    <div className="bg-zinc-800 p-8 rounded-3xl border border-zinc-700 relative overflow-hidden">
      <div className="flex justify-center gap-6 mb-12 relative z-10">
        <button
          onClick={() => triggerAnimation('dog')}
          disabled={animating}
          className={cn(
            "flex flex-col items-center p-4 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50",
            activeSignal === 'dog' ? "border-red-500 bg-red-500/20" : "border-zinc-600 hover:border-zinc-500 bg-zinc-700/50",
            animating && activeSignal !== 'dog' ? "opacity-50" : ""
          )}
        >
          <Dog className="w-12 h-12 mb-2 text-red-400" aria-hidden="true" />
          <span className="font-medium">Hundebild zeigen</span>
        </button>
        <button
          onClick={() => triggerAnimation('cat')}
          disabled={animating}
          className={cn(
            "flex flex-col items-center p-4 rounded-2xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
            activeSignal === 'cat' ? "border-blue-500 bg-blue-500/20" : "border-zinc-600 hover:border-zinc-500 bg-zinc-700/50",
            animating && activeSignal !== 'cat' ? "opacity-50" : ""
          )}
        >
          <Cat className="w-12 h-12 mb-2 text-blue-400" aria-hidden="true" />
          <span className="font-medium">Katzenbild zeigen</span>
        </button>
      </div>

      <div className="relative h-80 max-w-4xl mx-auto">
        {/* SVG Connections */}
        <div className="absolute inset-0 pointer-events-none z-0">
           <svg width="100%" height="100%" preserveAspectRatio="none">
             {/* Input to Hidden 1 */}
             {Array.from({length: 4}).map((_, i) => 
               Array.from({length: 6}).map((_, j) => {
                 const isActive = animStep >= 1;
                 const color = isActive ? (activeSignal === 'dog' ? '#ef4444' : '#3b82f6') : '#52525b';
                 const opacity = isActive ? 0.6 : 0.15;
                 return (
                   <line 
                     key={`l1-${i}-${j}`} 
                     x1="15%" y1={getNodeY(4, i)} 
                     x2="35%" y2={getNodeY(6, j)} 
                     stroke={color} strokeWidth="2"
                     opacity={opacity}
                     style={{ transition: 'all 0.4s ease' }}
                   />
                 );
               })
             )}
             {/* Hidden 1 to Hidden 2 */}
             {Array.from({length: 6}).map((_, i) => 
               Array.from({length: 6}).map((_, j) => {
                 const isActive = animStep >= 3;
                 const color = isActive ? (activeSignal === 'dog' ? '#ef4444' : '#3b82f6') : '#52525b';
                 const opacity = isActive ? 0.6 : 0.15;
                 return (
                   <line 
                     key={`l2-${i}-${j}`} 
                     x1="35%" y1={getNodeY(6, i)} 
                     x2="55%" y2={getNodeY(6, j)} 
                     stroke={color} strokeWidth="2"
                     opacity={opacity}
                     style={{ transition: 'all 0.4s ease' }}
                   />
                 );
               })
             )}
             {/* Hidden 2 to Output */}
             {Array.from({length: 6}).map((_, i) => 
               Array.from({length: 2}).map((_, j) => {
                 const isTargetNode = (activeSignal === 'dog' && j === 0) || (activeSignal === 'cat' && j === 1);
                 const isActive = animStep >= 5 && isTargetNode;
                 const color = isActive ? (activeSignal === 'dog' ? '#ef4444' : '#3b82f6') : '#52525b';
                 const opacity = isActive ? 0.6 : 0.15;
                 return (
                   <line 
                     key={`l3-${i}-${j}`} 
                     x1="55%" y1={getNodeY(6, i)} 
                     x2="75%" y2={getNodeY(2, j)} 
                     stroke={color} strokeWidth="2"
                     opacity={opacity}
                     style={{ transition: 'all 0.4s ease' }}
                   />
                 );
               })
             )}
           </svg>
        </div>

        {/* Nodes */}
        {layers.map((layer, layerIdx) => (
          <div 
            key={layer.id} 
            className="absolute top-0 bottom-0 flex flex-col items-center z-10"
            style={{ left: `${5 + layerIdx * 20}%`, width: '20%' }}
          >
            <div className="text-[10px] sm:text-xs font-mono text-zinc-400 mt-2 uppercase tracking-wider absolute -top-8 whitespace-nowrap">{layer.label}</div>
            
            {Array.from({ length: layer.nodes }).map((_, nodeIdx) => {
              const isOutput = layer.id === 'output';
              const isTargetNode = isOutput && ((activeSignal === 'dog' && nodeIdx === 0) || (activeSignal === 'cat' && nodeIdx === 1));
              
              let isNodeActive = false;
              if (layer.id === 'input' && animStep >= 0) isNodeActive = true;
              if (layer.id === 'hidden1' && animStep >= 2) isNodeActive = true;
              if (layer.id === 'hidden2' && animStep >= 4) isNodeActive = true;
              if (layer.id === 'output' && animStep >= 6 && isTargetNode) isNodeActive = true;
              
              let glowColor = activeSignal === 'dog' ? 'shadow-red-500/80 bg-red-400' : 'shadow-blue-500/80 bg-blue-400';
              const yPos = getNodeY(layer.nodes, nodeIdx);

              return (
                <div 
                  key={`${layer.id}-${nodeIdx}`}
                  className="absolute w-6 h-6"
                  style={{ top: yPos - 12, left: 'calc(50% - 12px)' }}
                >
                  <div
                    className={cn(
                      "w-full h-full rounded-full transition-all duration-500",
                      isNodeActive 
                        ? glowColor + " shadow-[0_0_15px_rgba(0,0,0,0.5)] border-transparent scale-110 opacity-100" 
                        : "bg-zinc-700 border-2 border-zinc-600 opacity-30"
                    )}
                  />
                  {/* Output Labels */}
                  {isOutput && (
                    <span className={cn(
                      "absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap font-medium transition-all duration-500",
                      animStep >= 7 && isTargetNode
                        ? (activeSignal === 'dog' ? "text-red-400 opacity-100 translate-x-0" : "text-blue-400 opacity-100 translate-x-0")
                        : "text-[#52525b] opacity-100 translate-x-0"
                    )}>
                      {nodeIdx === 0 ? 'Hund' : 'Katze'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center h-16" aria-live="polite">
        {result ? (
          <div className={cn(
            "inline-block px-6 py-3 rounded-xl text-xl font-bold animate-in fade-in slide-in-from-bottom-4",
            activeSignal === 'dog' ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
          )}>
            {result}
          </div>
        ) : animating ? (
          <div className="text-zinc-400 animate-pulse">Verarbeite Signal...</div>
        ) : (
          <div className="text-zinc-400">Klicke auf ein Icon, um den Prozess zu starten</div>
        )}
      </div>
    </div>
  );
}
