import { Injectable, signal, computed } from '@angular/core';

export type GameState = 'waiting' | 'in_progress' | 'completed' | 'feedback';

export interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswerId: string;
  explanation: string;
}

export interface PlayerState {
  score: number;
  lives: number;
  streak: number;
  correctAnswers: number;
  totalAnswered: number;
}

export interface GameSession {
  status: GameState;
  player: PlayerState;
  currentRound: number;
  totalRounds: number;
  currentQuestion: Question | null;
  lastAnswerCorrect: boolean | null;
}

export interface GameResults {
  finalScore: number;
  accuracy: number;
  xpEarned: number;
  coinsEarned: number;
}

const ASTROLOGY_QUESTIONS: Question[] = [
    { id: 'q1', question: 'Which planet is the traditional ruler of Scorpio?', options: [{ id: 'a', text: 'Mars' }, { id: 'b', text: 'Pluto' }, { id: 'c', text: 'Neptune' }, { id: 'd', text: 'Saturn' }], correctAnswerId: 'a', explanation: 'While Pluto is the modern ruler, Mars is the traditional ruler of Scorpio, governing passion and drive.' },
    { id: 'q2', question: 'Which zodiac sign is represented by the scales of justice?', options: [{ id: 'a', text: 'Gemini' }, { id: 'b', text: 'Aquarius' }, { id: 'c', text: 'Libra' }, { id: 'd', text: 'Virgo' }], correctAnswerId: 'c', explanation: 'Libra, an air sign ruled by Venus, is represented by the scales, symbolizing balance and harmony.' },
    { id: 'q3', question: 'What is the term for the point in the sky that was rising on the eastern horizon at the moment of birth?', options: [{ id: 'a', text: 'Midheaven' }, { id: 'b', text: 'Ascendant' }, { id: 'c', text: 'Descendant' }, { id: 'd', text: 'Nadir' }], correctAnswerId: 'b', explanation: 'The Ascendant, or Rising Sign, marks the beginning of the first house in a birth chart and represents one\'s outer personality.' },
    { id: 'q4', question: 'Which of these is considered a "mutable" sign?', options: [{ id: 'a', text: 'Taurus' }, { id: 'b', text: 'Leo' }, { id: 'c', text: 'Scorpio' }, { id: 'd', text: 'Sagittarius' }], correctAnswerId: 'd', explanation: 'Sagittarius is a mutable fire sign, known for adaptability. The other mutable signs are Gemini, Virgo, and Pisces.' },
    { id: 'q5', question: 'The "North Node" in a birth chart typically represents:', options: [{ id: 'a', text: 'Past life karma' }, { id: 'b', text: 'Current life purpose' }, { id: 'c', text: 'Emotional needs' }, { id: 'd', text: 'Public image' }], correctAnswerId: 'b', explanation: 'The North Node points towards the lessons, skills, and qualities one is meant to develop in this lifetime.' },
];

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private timerInterval: any;
  
  gameSession = signal<GameSession>(this.getInitialSession());
  
  timer = signal(15);
  results = signal<GameResults | null>(null);

  questionBank = signal<Question[]>(this.shuffleArray([...ASTROLOGY_QUESTIONS]));

  startGame() {
    this.questionBank.set(this.shuffleArray([...ASTROLOGY_QUESTIONS]));
    this.gameSession.set({
      ...this.getInitialSession(),
      status: 'in_progress',
    });
    this.results.set(null);
    this.loadNextQuestion();
  }
  
  submitAnswer(answerId: string) {
    clearInterval(this.timerInterval);
    const session = this.gameSession();
    const question = session.currentQuestion;

    if (!question) return;

    const isCorrect = question.correctAnswerId === answerId;
    const points = isCorrect ? 100 + this.timer() * 5 : 0; // Score based on time remaining

    this.gameSession.update(s => ({
      ...s,
      status: 'feedback',
      lastAnswerCorrect: isCorrect,
      player: {
        ...s.player,
        score: s.player.score + points,
        lives: isCorrect ? s.player.lives : Math.max(0, s.player.lives - 1),
        streak: isCorrect ? s.player.streak + 1 : 0,
        correctAnswers: isCorrect ? s.player.correctAnswers + 1 : s.player.correctAnswers,
        totalAnswered: s.player.totalAnswered + 1,
      },
    }));

    setTimeout(() => {
      this.loadNextQuestion();
    }, 2500);
  }

  private loadNextQuestion() {
    const session = this.gameSession();

    if (session.player.lives <= 0 || session.currentRound >= session.totalRounds) {
      this.endGame();
      return;
    }
    
    const nextRound = session.currentRound + 1;
    const nextQuestion = this.questionBank()[nextRound - 1];

    this.gameSession.update(s => ({
      ...s,
      status: 'in_progress',
      currentRound: nextRound,
      currentQuestion: nextQuestion,
    }));

    this.startTimer();
  }

  private endGame() {
    const session = this.gameSession();
    const accuracy = session.player.totalAnswered > 0 ? (session.player.correctAnswers / session.player.totalAnswered) * 100 : 0;
    const finalResults: GameResults = {
      finalScore: session.player.score,
      accuracy: accuracy,
      xpEarned: Math.round(session.player.score * 1.5),
      coinsEarned: Math.round(session.player.score / 10),
    };
    this.results.set(finalResults);
    this.gameSession.update(s => ({...s, status: 'completed' }));
  }

  private startTimer() {
    clearInterval(this.timerInterval);
    this.timer.set(15);
    this.timerInterval = setInterval(() => {
      this.timer.update(t => t - 1);
      if (this.timer() <= 0) {
        clearInterval(this.timerInterval);
        this.submitAnswer(''); // Auto-submit incorrect on timeout
      }
    }, 1000);
  }
  
  private getInitialSession(): GameSession {
    return {
      status: 'waiting',
      player: {
        score: 0,
        lives: 3,
        streak: 0,
        correctAnswers: 0,
        totalAnswered: 0,
      },
      currentRound: 0,
      totalRounds: ASTROLOGY_QUESTIONS.length,
      currentQuestion: null,
      lastAnswerCorrect: null,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}