export interface Stat {
  title: string;
  value: string;
  change: string;
  changeColor: string;
  icon: string;
  gradient: string;
}

export interface Activity {
  user: string;
  avatar: string;
  action: string;
  time: string;
  type: string;
  typeColor: string;
  gradient: string;
  borderColor: string;
}

export interface Event {
  category: string;
  categoryColor: string;
  date: string;
  title: string;
  description: string;
  attendees: string[];
  additionalAttendees: number;
  buttonColor: string;
  gradient: string;
  borderColor: string;
}