import { Injectable, signal } from '@angular/core';

export interface Chapter {
  id: number;
  title: string;
  content: string;
}

export interface WebNovel {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  description: string;
  chapters: Chapter[];
}

const WEB_NOVEL_DATA: WebNovel[] = [
  { 
    id: 1, 
    title: 'Lord of the Mysteries', 
    author: 'Cuttlefish That Loves Diving', 
    coverImage: 'https://picsum.photos/seed/lotm/300/450',
    description: 'In the waves of steam and machinery, who could achieve Beyonder? In the fog of history and darkness, who was whispering? I woke up to be faced with a series of mysteries—the Antigonus family book, the Blasphemy Slate, the secrets of the twenty-two Beyonder pathways...',
    chapters: [
      {
        id: 1,
        title: 'Chapter 1: The Crimson Moon',
        content: `The pain in his head was splitting. Klein Moretti felt as if he was being stabbed repeatedly by a blunt knife, a pain that seemed to originate from the depths of his soul.\n\nHe wanted to open his eyes, to sit up, but he was completely unable to control his limbs. He felt like a prisoner, trapped in a dark and narrow cage. As his consciousness gradually cleared, fragmented memories began to surface like bubbles rising from the deep sea.\n\nHe remembered being at his university library, preparing for his history final. The old tome he'd found, filled with strange symbols and what looked like a ritual, had piqued his academic curiosity. He'd tried to translate a small portion, chanting the words half-jokingly. Then, a crimson light had blinded him, and an unbearable headache had consumed him. When he came to, he was... here.\n\n"This isn't my body," he realized with a jolt of panic. The memories flooding his mind weren't his own. They belonged to a young man named Klein Moretti, a recent graduate of Tingen City's Khoy University, Department of History. This Klein had just committed suicide over a failed investment that had wiped out his family's meager savings.`
      },
      {
        id: 2,
        title: 'Chapter 2: The Nighthawks',
        content: `Following the memory fragments, Klein found a revolver in the desk drawer. The cold, heavy metal felt alien in his hand. The original Klein had put the barrel in his mouth... a wave of nausea and pity washed over him.\n\nSuddenly, a rhythmic tapping echoed from the door. Tap. Tap tap. Tap. A code?\n\nBefore he could react, the door creaked open. Two figures stood silhouetted against the hallway light. One was a tall man in a black trench coat, his face obscured by shadows. The other was a woman with silver-gray hair, her eyes sharp and discerning.\n\n"We are the Nighthawks," the man said, his voice low and steady. "We were alerted to an unusual fluctuation of spiritual energy in this area. It seems we were not mistaken." The woman, whose name he later learned was Dunn Smith, produced a silver pocket watch and let it dangle from its chain. "Klein Moretti," she said, her gaze intense, "you have encountered something you should not have. We're here to help you."\n\nKlein's heart pounded in his chest. These weren't ordinary police. Nighthawks... the name sent a shiver down his spine. It was a name from the original Klein's memories, associated with the Church of the Evernight Goddess, a special operations unit that dealt with the supernatural.`
      },
      {
        id: 3,
        title: 'Chapter 3: The Beyonder',
        content: `At the Nighthawks' headquarters, a gothic cathedral-like building hidden in plain sight, Klein was subjected to a series of tests. Dunn Smith explained that the ritual he'd inadvertently performed was a luck enhancement ceremony, but one that had a high chance of attracting malicious entities. His transmigration was a bizarre side effect, a one-in-a-million anomaly.\n\n"The world is not as simple as it seems," Dunn explained, offering him a cup of black coffee. "Beyond the steam engines and the gaslights, there are hidden pathways, sequences of power that grant ordinary people extraordinary abilities. We call these people... Beyonders."\n\nHe learned that the Nighthawks were all Beyonders, tasked with maintaining the balance between the ordinary world and the supernatural. They hunted rogue Beyonders, contained dangerous artifacts, and cleaned up the messes left by failed rituals. Because Klein had survived his encounter and now possessed a unique spiritual sensitivity, he was offered a choice: join them or have his memory of the event erased.\n\nFor the new Klein, a man out of time and place, there was only one real choice. He needed answers. He needed to understand this new world. And most importantly, he needed to find a way back.`
      }
    ]
  },
  { id: 2, title: 'Reverend Insanity', author: 'Gu Zhen Ren', coverImage: 'https://picsum.photos/seed/ri/300/450', description: 'A story of a villain, Fang Yuan, who is reborn 500 years into the past.', chapters: [] },
  { id: 3, title: 'The Beginning After The End', author: 'TurtleMe', coverImage: 'https://picsum.photos/seed/tbate/300/450', description: 'King Grey has unrivaled strength, wealth, and prestige in a world governed by martial ability. However, solitude lingers closely behind those with great power.', chapters: [] },
  { id: 4, title: 'Omniscient Reader\'s Viewpoint', author: 'Sing-Shong', coverImage: 'https://picsum.photos/seed/orv/300/450', description: 'Kim Dokja does not consider himself the protagonist of his own life.', chapters: [] },
  { id: 5, title: 'Shadow Slave', author: 'Guiltythree', coverImage: 'https://picsum.photos/seed/ss/300/450', description: 'Growing up in poverty, Sunny never expected anything good from life. However, even he did not anticipate being chosen by the Spell to become one of the Awakened - an elite group of people gifted with supernatural powers.', chapters: [] },
];

@Injectable({
  providedIn: 'root'
})
export class WebNovelService {
  private novels = signal<WebNovel[]>(WEB_NOVEL_DATA);

  getNovels() {
    return this.novels.asReadonly();
  }

  getNovelById(id: number): WebNovel | null {
    return this.novels().find(n => n.id === id) ?? null;
  }
}