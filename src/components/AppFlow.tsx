"use client";

import { useState } from "react";
import { MenuScreen } from "./menu/MenuScreen";
import { SubjectScreen } from "./subjects/SubjectScreen";
import { ChapterScreen } from "./chapters/ChapterScreen";
import { CourseScreen } from "./courses/CourseScreen";
import { ParkScreen } from "./park/ParkScreen";
import { parkKey } from "./park/data";
import { SUBJECTS } from "./subjects/data";
import { islandColor } from "./chapters/island";
import type { TravelDir } from "./space/travel";

type State =
  | { screen: "menu" }
  | { screen: "subjects"; from: "menu" | "chapters"; subjectId?: string; year?: string }
  | { screen: "chapters"; subjectId: string; year: string; returnFrom?: number }
  | { screen: "courses"; subjectId: string; year: string; chapterIndex: number; arriveDir?: TravelDir }
  | { screen: "park"; subjectId: string; year: string; chapterIndex: number; courseIndex: number; dir: TravelDir };

// Enchaînement des écrans de l'application.
export function AppFlow() {
  const [state, setState] = useState<State>({ screen: "menu" });
  const home = () => setState({ screen: "menu" });

  switch (state.screen) {
    case "menu":
      return <MenuScreen onEntered={() => setState({ screen: "subjects", from: "menu" })} />;

    case "subjects":
      return (
        <SubjectScreen
          intro={state.from === "menu"}
          returning={state.from === "chapters"}
          initialSubjectId={state.subjectId}
          initialYear={state.year}
          onSelect={(subjectId, year) => setState({ screen: "chapters", subjectId, year })}
        />
      );

    case "chapters": {
      const { subjectId, year } = state;
      return (
        <ChapterScreen
          subjectId={subjectId}
          year={year}
          returnFrom={state.returnFrom}
          onBack={() => setState({ screen: "subjects", from: "chapters", subjectId, year })}
          onHome={home}
          onSelectChapter={(chapterIndex) => setState({ screen: "courses", subjectId, year, chapterIndex })}
        />
      );
    }

    case "courses": {
      const { subjectId, year, chapterIndex } = state;
      return (
        <CourseScreen
          subjectId={subjectId}
          year={year}
          chapterIndex={chapterIndex}
          arriveDir={state.arriveDir}
          onBack={() => setState({ screen: "chapters", subjectId, year, returnFrom: chapterIndex })}
          onHome={home}
          onSelectCourse={(courseIndex, dir) => setState({ screen: "park", subjectId, year, chapterIndex, courseIndex, dir })}
        />
      );
    }

    case "park": {
      const { subjectId, year, chapterIndex, courseIndex } = state;
      const s = Math.max(0, SUBJECTS.findIndex((x) => x.id === subjectId));
      return (
        <ParkScreen
          parkKey={parkKey(subjectId, year, chapterIndex, courseIndex)}
          ground={islandColor(s, chapterIndex)}
          arriveDir={state.dir}
          onBack={(dir) => setState({ screen: "courses", subjectId, year, chapterIndex, arriveDir: dir })}
          onHome={home}
          onSelectLesson={() => {
            // TODO : écran de la leçon choisie.
          }}
        />
      );
    }
  }
}
