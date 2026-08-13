import json
import random
from datetime import datetime, timedelta
from database import engine, SessionLocal, Base
from models import User, UserPreference, Movie, Rating, UserInteraction, Watchlist
from security import hash_password

MOVIES_DATA = [
    # Sci-Fi / Thriller
    {
        "id": 1, "title": "Interstellar", "year": 2014, "genres": ["Sci-Fi", "Drama", "Adventure"],
        "language": "English", "rating": 8.7, "vote_count": 1850000,
        "overview": "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
        "poster_path": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80",
        "director": "Christopher Nolan", "cast_members": ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
        "keywords": ["space exploration", "wormhole", "time dilation", "black hole", "future"],
        "popularity": 98.5, "emotional_vibes": ["mind-bending", "epic", "emotional", "visual-masterpiece"]
    },
    {
        "id": 2, "title": "Inception", "year": 2010, "genres": ["Sci-Fi", "Action", "Thriller"],
        "language": "English", "rating": 8.8, "vote_count": 2200000,
        "overview": "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
        "poster_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Christopher Nolan", "cast_members": ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page"],
        "keywords": ["dream", "subconscious", "heist", "reality", "mind-bending"],
        "popularity": 99.1, "emotional_vibes": ["mind-bending", "intense", "thrilling", "clever"]
    },
    {
        "id": 3, "title": "The Martian", "year": 2015, "genres": ["Sci-Fi", "Adventure", "Drama"],
        "language": "English", "rating": 8.0, "vote_count": 850000,
        "overview": "An astronaut becomes stranded on Mars after his team assumes him dead, and must rely on his ingenuity to find a way to signal to Earth that he is alive.",
        "poster_path": "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?w=1200&auto=format&fit=crop&q=80",
        "director": "Ridley Scott", "cast_members": ["Matt Damon", "Jessica Chastain", "Kristen Wiig"],
        "keywords": ["mars", "survival", "space mission", "botany", "optimistic"],
        "popularity": 92.0, "emotional_vibes": ["inspiring", "witty", "survival", "uplifting"]
    },
    {
        "id": 4, "title": "Blade Runner 2049", "year": 2017, "genres": ["Sci-Fi", "Mystery", "Drama"],
        "language": "English", "rating": 8.0, "vote_count": 600000,
        "overview": "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
        "poster_path": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=1200&auto=format&fit=crop&q=80",
        "director": "Denis Villeneuve", "cast_members": ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
        "keywords": ["cyberpunk", "replicant", "future city", "ai", "identity"],
        "popularity": 89.4, "emotional_vibes": ["atmospheric", "philosophical", "visually-stunning", "dark"]
    },
    {
        "id": 5, "title": "Arrival", "year": 2016, "genres": ["Sci-Fi", "Mystery", "Drama"],
        "language": "English", "rating": 7.9, "vote_count": 720000,
        "overview": "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
        "poster_path": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&auto=format&fit=crop&q=80",
        "director": "Denis Villeneuve", "cast_members": ["Amy Adams", "Jeremy Renner", "Forest Whitaker"],
        "keywords": ["first contact", "linguistics", "time perception", "aliens", "emotional"],
        "popularity": 87.2, "emotional_vibes": ["thought-provoking", "poignant", "mysterious", "intellectual"]
    },
    {
        "id": 6, "title": "Tenet", "year": 2020, "genres": ["Sci-Fi", "Action", "Thriller"],
        "language": "English", "rating": 7.3, "vote_count": 520000,
        "overview": "Armed with only one word, Tenet, and fighting for the survival of the entire world, a Protagonist journeys through a twilight world of international espionage on a mission that will unfold in something beyond real time.",
        "poster_path": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
        "director": "Christopher Nolan", "cast_members": ["John David Washington", "Robert Pattinson", "Elizabeth Debicki"],
        "keywords": ["time inversion", "espionage", "entropy", "mind-bending", "action"],
        "popularity": 86.5, "emotional_vibes": ["complex", "fast-paced", "intense", "mind-bending"]
    },
    {
        "id": 7, "title": "Ex Machina", "year": 2014, "genres": ["Sci-Fi", "Drama", "Thriller"],
        "language": "English", "rating": 7.7, "vote_count": 540000,
        "overview": "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.",
        "poster_path": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
        "director": "Alex Garland", "cast_members": ["Alicia Vikander", "Domhnall Gleeson", "Oscar Isaac"],
        "keywords": ["artificial intelligence", "turing test", "android", "manipulation", "suspense"],
        "popularity": 83.0, "emotional_vibes": ["suspenseful", "chilling", "intellectual", "psychological"]
    },

    # Romance / Drama
    {
        "id": 8, "title": "Titanic", "year": 1997, "genres": ["Romance", "Drama"],
        "language": "English", "rating": 7.9, "vote_count": 1200000,
        "overview": "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic.",
        "poster_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop&q=80",
        "director": "James Cameron", "cast_members": ["Leonardo DiCaprio", "Kate Winslet", "Billy Zane"],
        "keywords": ["shipwreck", "class divide", "tragic romance", "epic", "historical"],
        "popularity": 96.2, "emotional_vibes": ["romantic", "emotional", "epic", "tearjerker"]
    },
    {
        "id": 9, "title": "The Notebook", "year": 2004, "genres": ["Romance", "Drama"],
        "language": "English", "rating": 7.8, "vote_count": 590000,
        "overview": "An elderly man reads to a woman with dementia the story of two young lovers who were separated by social differences in 1940s South Carolina.",
        "poster_path": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1200&auto=format&fit=crop&q=80",
        "director": "Nick Cassavetes", "cast_members": ["Ryan Gosling", "Rachel McAdams", "James Garner"],
        "keywords": ["true love", "memory", "1940s", "first love", "emotional"],
        "popularity": 91.0, "emotional_vibes": ["heartwarming", "passionate", "tearjerker", "romantic"]
    },
    {
        "id": 10, "title": "La La Land", "year": 2016, "genres": ["Romance", "Drama", "Comedy"],
        "language": "English", "rating": 8.0, "vote_count": 610000,
        "overview": "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
        "poster_path": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
        "director": "Damien Chazelle", "cast_members": ["Ryan Gosling", "Emma Stone", "John Legend"],
        "keywords": ["jazz", "hollywood", "musician", "dreams", "bittersweet"],
        "popularity": 94.5, "emotional_vibes": ["vibrant", "bittersweet", "musical", "romantic"]
    },
    {
        "id": 11, "title": "Pride & Prejudice", "year": 2005, "genres": ["Romance", "Drama"],
        "language": "English", "rating": 7.8, "vote_count": 310000,
        "overview": "Sparks fly when spirited Elizabeth Bennet meets single, rich, and proud Mr. Darcy. But Mr. Darcy reluctantly finds himself falling in love with a woman beneath his class.",
        "poster_path": "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80",
        "director": "Joe Wright", "cast_members": ["Keira Knightley", "Matthew Macfadyen", "Brenda Blethyn"],
        "keywords": ["period drama", "jane austen", "england", "misunderstanding", "class"],
        "popularity": 85.0, "emotional_vibes": ["classic", "witty", "romantic", "charming"]
    },
    {
        "id": 12, "title": "About Time", "year": 2013, "genres": ["Romance", "Drama", "Sci-Fi", "Comedy"],
        "language": "English", "rating": 7.8, "vote_count": 350000,
        "overview": "At the age of 21, Tim discovers he can travel in time and change what happens and has happened in his own life. His decision to make his world a better place by getting a girlfriend turns out to be not so easy.",
        "poster_path": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&auto=format&fit=crop&q=80",
        "director": "Richard Curtis", "cast_members": ["Domhnall Gleeson", "Rachel McAdams", "Bill Nighy"],
        "keywords": ["time travel", "family", "father son", "precious moments", "life lessons"],
        "popularity": 86.2, "emotional_vibes": ["feel-good", "touching", "heartwarming", "wholesome"]
    },
    {
        "id": 13, "title": "500 Days of Summer", "year": 2009, "genres": ["Romance", "Comedy", "Drama"],
        "language": "English", "rating": 7.7, "vote_count": 510000,
        "overview": "An offbeat romantic comedy about a woman who doesn't believe true love exists, and the young man who falls for her.",
        "poster_path": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&auto=format&fit=crop&q=80",
        "director": "Marc Webb", "cast_members": ["Joseph Gordon-Levitt", "Zooey Deschanel", "Geoffrey Arend"],
        "keywords": ["non-linear", "breakup", "expectation vs reality", "indie", "love"],
        "popularity": 82.5, "emotional_vibes": ["relatable", "bittersweet", "quirky", "witty"]
    },

    # Animation / Family / Comedy
    {
        "id": 14, "title": "Toy Story", "year": 1995, "genres": ["Animation", "Adventure", "Comedy", "Family"],
        "language": "English", "rating": 8.3, "vote_count": 1050000,
        "overview": "A cowboy doll is profoundly threatened and jealous when a new spaceman action figure supplants him as top toy in a boy's bedroom.",
        "poster_path": "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1535572290543-960a8046f5af?w=1200&auto=format&fit=crop&q=80",
        "director": "John Lasseter", "cast_members": ["Tom Hanks", "Tim Allen", "Don Rickles"],
        "keywords": ["toys", "friendship", "jealousy", "adventure", "classic animation"],
        "popularity": 95.0, "emotional_vibes": ["nostalgic", "fun", "family-friendly", "classic"]
    },
    {
        "id": 15, "title": "Finding Nemo", "year": 2003, "genres": ["Animation", "Adventure", "Comedy", "Family"],
        "language": "English", "rating": 8.2, "vote_count": 1020000,
        "overview": "After his son is captured in the Great Barrier Reef and taken to Sydney, a timid clownfish sets out on a journey to bring him home.",
        "poster_path": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&auto=format&fit=crop&q=80",
        "director": "Andrew Stanton", "cast_members": ["Albert Brooks", "Ellen DeGeneres", "Alexander Gould"],
        "keywords": ["ocean", "father son", "fish", "rescue mission", "barrier reef"],
        "popularity": 94.0, "emotional_vibes": ["heartwarming", "funny", "adventurous", "feel-good"]
    },
    {
        "id": 16, "title": "Up", "year": 2009, "genres": ["Animation", "Adventure", "Comedy", "Family"],
        "language": "English", "rating": 8.3, "vote_count": 1080000,
        "overview": "78-year-old Carl Fredricksen travels to Paradise Falls in his house equipped with balloons, inadvertently taking a young stowaway.",
        "poster_path": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        "director": "Pete Docter", "cast_members": ["Edward Asner", "Jordan Nagai", "John Ratzenberger"],
        "keywords": ["balloons", "old age", "grief", "adventure", "unlikely friendship"],
        "popularity": 95.8, "emotional_vibes": ["tearjerker", "inspiring", "wholesome", "adventurous"]
    },
    {
        "id": 17, "title": "WALL-E", "year": 2008, "genres": ["Animation", "Adventure", "Sci-Fi", "Family"],
        "language": "English", "rating": 8.4, "vote_count": 1100000,
        "overview": "In a distant, but not unrealistic, future, a small waste-collecting robot inadvertently embarks on a space journey that will ultimately decide the fate of mankind.",
        "poster_path": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
        "director": "Andrew Stanton", "cast_members": ["Ben Burtt", "Elissa Knight", "Jeff Garlin"],
        "keywords": ["robot", "earth environment", "love story", "space station", "future"],
        "popularity": 96.0, "emotional_vibes": ["charming", "poignant", "environmentalist", "wholesome"]
    },
    {
        "id": 18, "title": "Kung Fu Panda", "year": 2008, "genres": ["Animation", "Action", "Adventure", "Comedy"],
        "language": "English", "rating": 7.6, "vote_count": 520000,
        "overview": "To everyone's surprise, including his own, Po, an clumsy panda, is chosen as the Dragon Warrior to protect the Valley of Peace.",
        "poster_path": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
        "director": "Mark Osborne", "cast_members": ["Jack Black", "Ian McShane", "Angelina Jolie"],
        "keywords": ["martial arts", "panda", "destiny", "humor", "ancient china"],
        "popularity": 88.5, "emotional_vibes": ["hilarious", "action-packed", "inspiring", "fun"]
    },
    {
        "id": 19, "title": "Spirited Away", "year": 2001, "genres": ["Animation", "Adventure", "Fantasy", "Family"],
        "language": "Japanese", "rating": 8.6, "vote_count": 790000,
        "overview": "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches and spirits, and where humans are changed into beasts.",
        "poster_path": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        "director": "Hayao Miyazaki", "cast_members": ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
        "keywords": ["ghibli", "spirits", "bathhouse", "courage", "magic"],
        "popularity": 97.1, "emotional_vibes": ["enchanting", "surreal", "masterpiece", "magical"]
    },

    # Action / Drama / Crime
    {
        "id": 20, "title": "The Dark Knight", "year": 2008, "genres": ["Action", "Crime", "Drama", "Thriller"],
        "language": "English", "rating": 9.0, "vote_count": 2800000,
        "overview": "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
        "poster_path": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Christopher Nolan", "cast_members": ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
        "keywords": ["batman", "joker", "chaos", "gotham", "vigilante"],
        "popularity": 99.8, "emotional_vibes": ["intense", "dark", "thrilling", "masterpiece"]
    },
    {
        "id": 21, "title": "Pulp Fiction", "year": 1994, "genres": ["Crime", "Drama"],
        "language": "English", "rating": 8.9, "vote_count": 2100000,
        "overview": "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        "poster_path": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
        "director": "Quentin Tarantino", "cast_members": ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
        "keywords": ["hitman", "non-linear", "dialogue-driven", "cult classic", "los angeles"],
        "popularity": 97.0, "emotional_vibes": ["stylish", "witty", "gritty", "unconventional"]
    },
    {
        "id": 22, "title": "The Shawshank Redemption", "year": 1994, "genres": ["Drama"],
        "language": "English", "rating": 9.3, "vote_count": 2900000,
        "overview": "Over the course of several years, two convicts form a friendship, seeking consolation and eventual redemption through basic compassion.",
        "poster_path": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Frank Darabont", "cast_members": ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
        "keywords": ["prison", "hope", "friendship", "escape", "redemption"],
        "popularity": 99.9, "emotional_vibes": ["inspiring", "uplifting", "profound", "masterpiece"]
    },
    {
        "id": 23, "title": "Parasite", "year": 2019, "genres": ["Drama", "Thriller", "Comedy"],
        "language": "Korean", "rating": 8.5, "vote_count": 910000,
        "overview": "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
        "poster_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Bong Joon Ho", "cast_members": ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
        "keywords": ["class struggle", "social satire", "deception", "basement", "oscar winner"],
        "popularity": 95.5, "emotional_vibes": ["suspenseful", "shocking", "social-commentary", "brilliant"]
    },
    {
        "id": 24, "title": "Whiplash", "year": 2014, "genres": ["Drama", "Music"],
        "language": "English", "rating": 8.5, "vote_count": 920000,
        "overview": "A promising young drummer enlists at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
        "poster_path": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
        "director": "Damien Chazelle", "cast_members": ["Miles Teller", "J.K. Simmons", "Melissa Benoist"],
        "keywords": ["jazz drummer", "obsession", "perfectionism", "relentless teacher", "intense"],
        "popularity": 93.0, "emotional_vibes": ["electrifying", "intense", "obsessive", "thrilling"]
    },

    # Additional Hindi & International Cinema
    {
        "id": 25, "title": "3 Idiots", "year": 2009, "genres": ["Comedy", "Drama"],
        "language": "Hindi", "rating": 8.4, "vote_count": 420000,
        "overview": "Two friends are searching for their long lost companion. They revisit their college days and recall the memories of their friend who inspired them to think differently.",
        "poster_path": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80",
        "director": "Rajkumar Hirani", "cast_members": ["Aamir Khan", "Madhavan", "Sharman Joshi", "Kareena Kapoor"],
        "keywords": ["engineering college", "friendship", "education system", "passion", "humor"],
        "popularity": 92.5, "emotional_vibes": ["inspiring", "hilarious", "feel-good", "heartwarming"]
    },
    {
        "id": 26, "title": "Dangal", "year": 2016, "genres": ["Action", "Biography", "Drama", "Sport"],
        "language": "Hindi", "rating": 8.3, "vote_count": 210000,
        "overview": "Former wrestler Mahavir Singh Phogat and his two wrestler daughters struggle towards glory at the Commonwealth Games in the face of societal oppression.",
        "poster_path": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80",
        "director": "Nitesh Tiwari", "cast_members": ["Aamir Khan", "Fatima Sana Shaikh", "Sanya Malhotra"],
        "keywords": ["wrestling", "father daughter", "india sports", "empowerment", "gold medal"],
        "popularity": 89.0, "emotional_vibes": ["motivational", "intense", "triumphant", "inspiring"]
    },
    {
        "id": 27, "title": "RRR", "year": 2022, "genres": ["Action", "Drama", "Adventure"],
        "language": "Telugu", "rating": 7.8, "vote_count": 180000,
        "overview": "A fearless revolutionary and an officer in the British force, who are best friends, decide to join forces to fight against the British Empire in 1920s India.",
        "poster_path": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
        "director": "S.S. Rajamouli", "cast_members": ["N.T. Rama Rao Jr.", "Ram Charan", "Alia Bhatt"],
        "keywords": ["revolution", "brotherhood", "epic action", "freedom struggle", "spectacle"],
        "popularity": 93.5, "emotional_vibes": ["over-the-top", "exhilarating", "epic", "high-energy"]
    },
    {
        "id": 28, "title": "Everything Everywhere All at Once", "year": 2022, "genres": ["Sci-Fi", "Action", "Comedy", "Adventure"],
        "language": "English", "rating": 7.8, "vote_count": 490000,
        "overview": "A middle-aged Chinese immigrant is swept up into an insane adventure in which she alone can save existence by exploring other universes and connecting with the lives she could have led.",
        "poster_path": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Daniel Kwan, Daniel Scheinert", "cast_members": ["Michelle Yeoh", "Stephanie Hsu", "Ke Huy Quan"],
        "keywords": ["multiverse", "family drama", "nihilism vs kindness", "absurdist", "oscar winner"],
        "popularity": 94.8, "emotional_vibes": ["mind-bending", "emotional", "wild", "heartfelt"]
    },
    {
        "id": 29, "title": "Grand Budapest Hotel", "year": 2014, "genres": ["Comedy", "Adventure", "Crime"],
        "language": "English", "rating": 8.1, "vote_count": 820000,
        "overview": "A writer encounters the owner of a high-class hotel who tells of his early years as a lobby boy during the hotel's glorious years under an exceptional concierge.",
        "poster_path": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80",
        "director": "Wes Anderson", "cast_members": ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan"],
        "keywords": ["concierge", "symmetry", "painting heist", "whimsical", "europe"],
        "popularity": 90.1, "emotional_vibes": ["whimsical", "stylized", "witty", "delightful"]
    },
    {
        "id": 30, "title": "Shutter Island", "year": 2010, "genres": ["Mystery", "Thriller", "Drama"],
        "language": "English", "rating": 8.2, "vote_count": 1400000,
        "overview": "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane.",
        "poster_path": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
        "backdrop_path": "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80",
        "director": "Christopher Nolan", "cast_members": ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley"],
        "keywords": ["psychiatric hospital", "twist ending", "hallucinations", "grief", "investigation"],
        "popularity": 92.4, "emotional_vibes": ["chilling", "mind-bending", "dark", "suspenseful"]
    }
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Insert Movies if empty
        existing_movies = db.query(Movie).count()
        if existing_movies == 0:
            print("Seeding movie database...")
            for item in MOVIES_DATA:
                movie = Movie(
                    id=item["id"],
                    title=item["title"],
                    year=item["year"],
                    genres=json.dumps(item["genres"]),
                    language=item["language"],
                    rating=item["rating"],
                    vote_count=item["vote_count"],
                    overview=item["overview"],
                    poster_path=item["poster_path"],
                    backdrop_path=item["backdrop_path"],
                    director=item["director"],
                    cast_members=json.dumps(item["cast_members"]),
                    keywords=json.dumps(item["keywords"]),
                    popularity=item["popularity"],
                    emotional_vibes=json.dumps(item["emotional_vibes"])
                )
                db.add(movie)
            db.commit()
            print(f"Added {len(MOVIES_DATA)} movies.")

        # 2. Insert Demo Users if empty
        existing_users = db.query(User).count()
        if existing_users == 0:
            print("Seeding demo users & preferences...")
            
            # User A: Sci-Fi Fan
            user_a = User(
                name="Alex Vance (Sci-Fi Fan)",
                email="scifi_user@cinematch.ai",
                password_hash=hash_password("password123"),
                is_admin=False
            )
            # User B: Romance Fan
            user_b = User(
                name="Sophia Rose (Romance Fan)",
                email="romance_user@cinematch.ai",
                password_hash=hash_password("password123"),
                is_admin=False
            )
            # User C: Animation Fan
            user_c = User(
                name="Leo Das (Animation Fan)",
                email="animation_user@cinematch.ai",
                password_hash=hash_password("password123"),
                is_admin=False
            )
            # Admin User
            admin_user = User(
                name="Hackathon Evaluator",
                email="admin@cinematch.ai",
                password_hash=hash_password("admin123"),
                is_admin=True
            )

            db.add_all([user_a, user_b, user_c, admin_user])
            db.commit()

            # Add user preferences
            pref_a = UserPreference(
                user_id=user_a.id,
                preferred_genres=json.dumps(["Sci-Fi", "Thriller", "Mystery"]),
                preferred_languages=json.dumps(["English"]),
                min_rating=7.5,
                max_rating=10.0,
                discovery_slider=0.4,
                preferred_era=json.dumps(["2010-2020", "2020+"]),
                favorite_movies=json.dumps([1, 2, 3, 4]), # Interstellar, Inception, Martian, Blade Runner
                onboarding_completed=True
            )
            pref_b = UserPreference(
                user_id=user_b.id,
                preferred_genres=json.dumps(["Romance", "Drama"]),
                preferred_languages=json.dumps(["English"]),
                min_rating=7.0,
                max_rating=10.0,
                discovery_slider=0.5,
                preferred_era=json.dumps(["1980-2000", "2000-2010", "2010-2020"]),
                favorite_movies=json.dumps([8, 9, 10, 11]), # Titanic, Notebook, La La Land, Pride & Prejudice
                onboarding_completed=True
            )
            pref_c = UserPreference(
                user_id=user_c.id,
                preferred_genres=json.dumps(["Animation", "Adventure", "Comedy", "Family"]),
                preferred_languages=json.dumps(["English", "Japanese"]),
                min_rating=7.5,
                max_rating=10.0,
                discovery_slider=0.6,
                preferred_era=json.dumps(["2000-2010", "2010-2020", "2020+"]),
                favorite_movies=json.dumps([14, 15, 16, 17, 19]), # Toy Story, Finding Nemo, Up, Wall-E, Spirited Away
                onboarding_completed=True
            )
            pref_admin = UserPreference(
                user_id=admin_user.id,
                preferred_genres=json.dumps(["Sci-Fi", "Drama", "Action"]),
                preferred_languages=json.dumps(["English"]),
                min_rating=6.0,
                discovery_slider=0.5,
                onboarding_completed=True
            )
            db.add_all([pref_a, pref_b, pref_c, pref_admin])
            db.commit()

            # Seed specific interactions for distinct recommendation signals
            # User A likes Sci-Fi
            for m_id in [1, 2, 3, 4, 5, 6, 7]:
                db.add(Rating(user_id=user_a.id, movie_id=m_id, rating=random.uniform(8.5, 10.0)))
                db.add(UserInteraction(user_id=user_a.id, movie_id=m_id, interaction_type="LIKE", weight=1.0))

            # User B likes Romance
            for m_id in [8, 9, 10, 11, 12, 13]:
                db.add(Rating(user_id=user_b.id, movie_id=m_id, rating=random.uniform(8.5, 10.0)))
                db.add(UserInteraction(user_id=user_b.id, movie_id=m_id, interaction_type="LIKE", weight=1.0))

            # User C likes Animation
            for m_id in [14, 15, 16, 17, 18, 19]:
                db.add(Rating(user_id=user_c.id, movie_id=m_id, rating=random.uniform(8.5, 10.0)))
                db.add(UserInteraction(user_id=user_c.id, movie_id=m_id, interaction_type="LIKE", weight=1.0))

            # Seed additional synthetic mock users to give SVD collaborative model rich matrix patterns
            for u_idx in range(5, 20):
                mock_user = User(
                    name=f"Viewer_{u_idx}",
                    email=f"user_{u_idx}@cinematch.ai",
                    password_hash=hash_password("password123"),
                    is_admin=False
                )
                db.add(mock_user)
                db.commit()
                # Cluster mock users into genre affinities
                cluster = u_idx % 3
                if cluster == 0:  # Sci-Fi group
                    target_movies = [1, 2, 3, 4, 5, 6, 7, 20, 28, 30]
                elif cluster == 1:  # Romance group
                    target_movies = [8, 9, 10, 11, 12, 13, 24, 29]
                else:  # Animation / Family group
                    target_movies = [14, 15, 16, 17, 18, 19, 25, 28]

                for m_id in random.sample(target_movies, min(len(target_movies), 6)):
                    r_val = round(random.uniform(7.0, 10.0), 1)
                    db.add(Rating(user_id=mock_user.id, movie_id=m_id, rating=r_val))
                    db.add(UserInteraction(user_id=mock_user.id, movie_id=m_id, interaction_type="LIKE", weight=1.0))

            db.commit()
            print("Successfully seeded users, ratings, and interaction history!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
