import React, { useState } from "react";
import { motion } from "framer-motion";

const IMAGES = {
  notEnough: "/images/notenough.png",
  inDoubt: "/images/doubt.png",
  thumbsUp: "/images/thumbsup.png",
  thumbsDown: "/images/thumbsdown.png"
};

// Example threshold, adjust as needed
const THRESHOLD = 2;

export default function JudgeScoringApp() {
  // Weighted categories
  const categories = [
    {
      name: "W",
      type: "W", // adds to WScore
      questions: [
        "De werkgevende is bevoegd om aanwijzingen en instructies te geven over de wijze waarop de werkende de werkzaamheden moet uitvoeren en de werkende moet deze ook opvolgen.",
        "De werkgevende heeft de mogelijkheid om de werkzaamheden van de werkende te controleren en is bevoegd om op basis daarvan in te grijpen.",
        "De werkzaamheden worden verricht binnen het organisatorisch kader van de organisatie van de werkgevende.",
        "De werkzaamheden hebben een structureel karakter binnen de organisatie.",
        "Werkzaamheden worden zij-aan-zij verricht met werknemers die soortgelijke werkzaamheden verrichten."
      ],
      /**
       * Weights in the same order:
       * W1 => 2.0,
       * W2 => 1.5,
       * W3 => 1.5,
       * W4 => 1.0,
       * W5 => 1.0
       */
      weights: [2.0, 1.5, 1.5, 1.0, 1.0]
    },
    {
      name: "Z",
      type: "ZOP", // adds to ZOPScore
      questions: [
        "De financiële risico’s en resultaten van de werkzaamheden liggen bij de werkende.",
        "Bij het verrichten van de werkzaamheden is de werkende zelf verantwoordelijk voor gereedschap, hulpmiddelen en materialen.",
        "De werkende is in het bezit van een specifieke opleiding, werkervaring, kennis of vaardigheden, die in de organisatie van de werkgevende niet structureel aanwezig is.",
        "De werkende treedt tijdens de werkzaamheden zelfstandig naar buiten.",
        "Er is sprake van een korte duur van de opdracht en/of een beperkt aantal uren per week."
      ],
      /**
       * Z1 => 2.0,
       * Z2 => 1.5,
       * Z3 => 1.5,
       * Z4 => 1.0,
       * Z5 => 1.0
       */
      weights: [2.0, 1.5, 1.5, 1.0, 1.0]
    },
    {
      name: "OP",
      type: "ZOP", // also adds to ZOPScore
      questions: [
        "De werkende heeft meerdere opdrachtgevers per jaar;",
        "De werkende besteedt tijd en/of geld aan het verwerven van een reputatie en het vinden van nieuwe klanten of opdrachtgevers;",
        "De werkende heeft bedrijfsinvesteringen van enige omvang;",
        "De werkende gedraagt zich administratief als zelfstandig ondernemer: is ingeschreven bij de KVK, is btw-ondernemer en/of heeft recht op de fiscale voordelen van het ondernemerschap (zoals ondernemersfaciliteiten)"
      ],
      /**
       * OP1 => 2.0,
       * OP2 => 1.5,
       * OP3 => 1.5,
       * OP4 => 1.0
       */
      weights: [2.0, 1.5, 1.5, 1.0]
    }
  ];

  /**
   * answers[catIndex][qIndex] => one of:
   * 'ja' => +1
   * 'gedeeltelijk' => +0.5
   * 'nee' => +0
   * null => unanswered
   */
  const [answers, setAnswers] = useState(
    categories.map(cat => Array(cat.questions.length).fill(null))
  );

  const setAnswer = (catIndex, qIndex, value) => {
    const updated = [...answers];
    updated[catIndex] = [...updated[catIndex]];
    updated[catIndex][qIndex] = value;
    setAnswers(updated);
  };

  /** Convert 'ja'|'gedeeltelijk'|'nee' => numeric 1|0.5|0 */
  function answerValue(ans) {
    if (ans === "ja") return 1;
    if (ans === "gedeeltelijk") return 0.5;
    return 0; // covers 'nee' or null
  }

  /** Summation with weighting to get WScore / ZOPScore */
  function computeScores() {
    let WScore = 0;
    let ZOPScore = 0;

    categories.forEach((cat, catIndex) => {
      answers[catIndex].forEach((ans, qIndex) => {
        const numericVal = answerValue(ans);
        const weight = cat.weights[qIndex];
        const score = numericVal * weight;

        if (cat.type === "W") {
          WScore += score;
        } else {
          ZOPScore += score;
        }
      });
    });

    return { WScore, ZOPScore };
  }

  const { WScore, ZOPScore } = computeScores();
  const RI = ZOPScore - WScore;

  // 4-state logic
  // 0 => not enough answered
  // 1 => doubt
  // 2 => positive
  // 3 => negative

  const totalQuestions = categories.reduce((acc, c) => acc + c.questions.length, 0);
  const answeredCount = answers.reduce(
    (acc, catAns) => acc + catAns.filter(a => a !== null).length,
    0
  );

  function computeFinalState() {
    // Fewer than 50% answered => 0
    if (answeredCount < totalQuestions / 2) {
      return 0;
    }

    // Evaluate RI with threshold
    if (RI > THRESHOLD) return 2; // thumbs up
    if (RI < -THRESHOLD) return 3; // thumbs down
    return 1; // doubt
  }

  const finalState = computeFinalState();

  function getJudgeView() {
    switch (finalState) {
      case 0:
        return {
          src: IMAGES.notEnough,
          alt: "Not Enough Answers",
          text: "Nog te weinig vragen beantwoord"
        };
      case 1:
        return {
          src: IMAGES.inDoubt,
          alt: "In Doubt",
          text: "We twijfelen nog.."
        };
      case 2:
        return {
          src: IMAGES.thumbsUp,
          alt: "Thumbs Up",
          text: "Prima! Waarschijnlijk geen sprake van een dienstverband."
        };
      case 3:
        return {
          src: IMAGES.thumbsDown,
          alt: "Thumbs Down",
          text: "Let op! Waarschijnlijk sprake van een dienstverband."
        };
      default:
        return {
          src: IMAGES.notEnough,
          alt: "Error",
          text: "Onbekende status"
        };
    }
  }

  const judge = getJudgeView();

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen max-w-screen">
      {/* LEFT: scrollable questions */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-6 pb-48 md:pb-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Beoordeel een werkrelatie
        </h1>
        <p>
          <i>Gebaseerd op aangepast wetsvoorstel VBAR 27 maart 2025. Kijk onderaan deze pagina voor bronnen en informatie. <br /><br /></i>
        </p>

        {categories.map((cat, catIndex) => (
          <div key={catIndex} className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              {cat.name}
            </h2>
            {cat.questions.map((question, qIndex) => {
              const currentVal = answers[catIndex][qIndex];
              return (
                <div key={qIndex} className="my-4">
                  <p className="text-lg text-gray-700 mb-2">{question}</p>
                  <div className="flex gap-4">
                    {/* Ja => 1 */}
                    <button
                      className={
                        currentVal === "ja"
                          ? "px-4 py-2 rounded bg-gray-800 text-white"
                          : "px-4 py-2 rounded border border-gray-800 text-gray-800"
                      }
                      onClick={() => setAnswer(catIndex, qIndex, "ja")}
                    >
                      Ja
                    </button>
                    {/* Gedeeltelijk => 0.5 */}
                    <button
                      className={
                        currentVal === "gedeeltelijk"
                          ? "px-4 py-2 rounded bg-gray-800 text-white"
                          : "px-4 py-2 rounded border border-gray-800 text-gray-800"
                      }
                      onClick={() => setAnswer(catIndex, qIndex, "gedeeltelijk")}
                    >
                      Gedeeltelijk
                    </button>
                    {/* Nee => 0 */}
                    <button
                      className={
                        currentVal === "nee"
                          ? "px-4 py-2 rounded bg-gray-800 text-white"
                          : "px-4 py-2 rounded border border-gray-800 text-gray-800"
                      }
                      onClick={() => setAnswer(catIndex, qIndex, "nee")}
                    >
                      Nee
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <p className="mt-8">
          Bronnen: <br />
          <ol>
            <li><a href="https://open.overheid.nl/documenten/1ee9a35b-b8a8-48b5-a3ff-79134b224647/file">Voortgangsbrief werken met en als zelfstandige(n) 27 maart 2025</a> <span>https://open.overheid.nl/documenten/1ee9a35b-b8a8-48b5-a3ff-79134b224647/file</span></li>
            <li><a href="https://wetgevingskalender.overheid.nl/Regeling/WGK014517/Download/e12fc78d-ac0b-471b-8f65-378f130d439b_1.pdf">Wijziging van Boek 7 van het Burgerlijk Wetboek in verband met het
verduidelijken van wanneer sprake is van werken in dienst van een ander in
de zin van artikel 610 van Boek 7 van het Burgerlijk Wetboek en het invoeren
van een rechtsvermoeden</a> <span>https://wetgevingskalender.overheid.nl/Regeling/WGK014517/Download/e12fc78d-ac0b-471b-8f65-378f130d439b_1.pdf</span></li>
            <li><a href="https://github.com/mathijs-b2m/zzp-vbar">Broncode berekening: </a> <span>https://github.com/mathijs-b2m/zzp-vbar</span></li>
          </ol> 
        </p>
      </div>
      {/* Right side: pinned judge
          Mobile: short container (row) with smaller image
          Desktop: full height (column) with larger image
       */}
      <div
        className="
          /* Mobile default: row, short container. */
          flex flex-row items-center justify-center space-x-4 
          h-40 w-full fixed bottom-0

          /* Desktop overrides: column, sticky, centered content, full height. */
          md:sticky md:top-0 md:h-screen md:flex-col md:space-x-0 md:space-y-4 md:justify-center md:w-1/3

          bg-gray-100 p-4
        "
      >
        <motion.img
          key={judge.alt}
          src={judge.src}
          alt={judge.alt}
          className="
            object-contain
            max-h-full
            max-w-[40%]
            md:max-w-[80%]  /* Let it grow bigger on desktop */
          "
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        />

        <div className="flex flex-col items-center text-center">
          <p className="text-lg font-semibold text-gray-800 px-2">
            {judge.text}
          </p>
          <div className="mt-4 text-gray-700 text-sm">
            <p>W Score: {WScore.toFixed(1)}</p>
            <p>Z+OP Score: {ZOPScore.toFixed(1)}</p>
            <p>RI = {RI.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}