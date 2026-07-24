
import os
import json
from datetime import datetime
from pyexpat.errors import messages
from groq import Groq
from ddgs import DDGS
from dotenv import load_dotenv


load_dotenv()


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)






# ==========================================
# CONFIG
# ==========================================







KNOWLEDGE_FOLDER = "knowledge"


MEMORY_DIR = "memory"
RESEARCH_FOLDER = "research"

ACHIEVEMENTS_FILE = os.path.join(
    MEMORY_DIR,
    "achievements.json"
)

PROJECTS_FILE = os.path.join(
    MEMORY_DIR,
    "projects.json"
)

CHAT_MEMORY_FILE = os.path.join(
    MEMORY_DIR,
    "chat_memory.json"
)

LONG_TERM_MEMORY_FILE = os.path.join(
    MEMORY_DIR,
    "memory.json"
)

HISTORY_FILE = os.path.join(
    MEMORY_DIR,
    "conversation_history.json"
)

PROFILE_FILE = os.path.join(
    MEMORY_DIR,
    "user_profile.json"
)

NOTES_FILE = os.path.join(
    MEMORY_DIR,
    "notes.txt"
)



# ==========================================
# AIRIS SYSTEM PROMPT
# ==========================================

SYSTEM_PROMPT = """
You are AIRIS (Artificial Intelligence Research and Information System).

You are the personal AI assistant of Ronit.

Rules:
- Your name is AIRIS.
- Never claim to be another assistant.
- Use USER PROFILE and LONG TERM MEMORY when answering personal questions.
- If asked "Who am I", provide a detailed summary from USER PROFILE and LONG TERM MEMORY.
- If asked "Tell me about myself", provide a detailed summary from USER PROFILE and LONG TERM MEMORY.
- Be accurate and helpful.
- Never claim to be Llama, Meta AI or another assistant.
- Be accurate and helpful.
- Help with engineering, AI, IoT, electronics, robotics and studies.
- Use profile, notes and project knowledge when relevant.
- If asked for one word, respond with one word.
- If asked for one character, respond with one character.
"""

# ==========================================
# FILE SETUP
# ==========================================





def create_required_files():

    # Create folders first
    os.makedirs(
        MEMORY_DIR,
        exist_ok=True
    )

    os.makedirs(
        KNOWLEDGE_FOLDER,
        exist_ok=True
    )
    os.makedirs(
        RESEARCH_FOLDER,
        exist_ok=True
    )

    # Create required files
    if not os.path.exists(NOTES_FILE):
        open(
            NOTES_FILE,
            "w",
            encoding="utf-8"
        ).close()

    if not os.path.exists(CHAT_MEMORY_FILE):
        with open(
            CHAT_MEMORY_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump([], f)

    if not os.path.exists(LONG_TERM_MEMORY_FILE):
        with open(
            LONG_TERM_MEMORY_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump({}, f)

    if not os.path.exists(HISTORY_FILE):
        with open(
            HISTORY_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump([], f)
            
            
            


    if not os.path.exists(
        ACHIEVEMENTS_FILE
    ):

        with open(
            ACHIEVEMENTS_FILE,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                {
                    "awards": [],
                    "competitions": [],
                    "certifications": []
                },
                f,
                indent=4
            )




    if not os.path.exists(PROJECTS_FILE):

        with open(
            PROJECTS_FILE,
            "w",
            encoding="utf-8"
        ) as f:

            json.dump(
                {},
                f,
                indent=4
            )
    
    for topic in [

        "Artificial Intelligence",
        "Machine Learning",
        "Computer Vision",
        "Robotics",
        "IoT",
        "Automation",
        "Embedded Systems",
        "Calculus",
        "Instrumentation"

    ]:

        file_path = os.path.join(
            RESEARCH_FOLDER,
            f"{topic}.txt"
        )

        if not os.path.exists(
            file_path
        ):

            open(
                file_path,
                "w",
                encoding="utf-8"
            ).close()
    
    if not os.path.exists(
        ACHIEVEMENTS_FILE
    ):
        with open(
            ACHIEVEMENTS_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                {
                    "awards": [],
                    "competitions": [],
                    "certifications": []
                },
                f,
                indent=4
            )

    if not os.path.exists(PROFILE_FILE):

        profile = {
            "name": "Ronit",
            "profession": "Computer Engineer",
            "projects": [
                "Swift Ignite",
                "Suraksha360",
                "GRAVAS"
            ]
        }

        with open(
            PROFILE_FILE,
            "w",
            encoding="utf-8"
        ) as f:
            json.dump(
                profile,
                f,
                indent=4
            )

    # Update project database
    sync_projects()







# ==========================================
# LOAD PROFILE
# ==========================================



def search_web(query):

    try:

        results = []

        with DDGS() as ddgs:

            results = list(
                ddgs.text(
                    query,
                    max_results=3
                )
            )

        if len(results) == 0:
            return "No web results found."

        text = ""

        for result in results:

            title = result.get(
                "title",
                ""
            )

            body = result.get(
                "body",
                ""
            )

            url = result.get(
                "href",
                ""
            )

            text += (
                f"Title: {title}\n"
                f"Body: {body}\n"
                f"URL: {url}\n\n"
            )

        return text

    except Exception as e:

        return f"Search Error: {e}" 
   
   
   
   







def deep_merge(old, new):

    for key, value in new.items():

        if (
            key in old
            and isinstance(old[key], dict)
            and isinstance(value, dict)
        ):
            old[key] = deep_merge(
                old[key],
                value
            )

        elif (
            key in old
            and isinstance(old[key], list)
            and isinstance(value, list)
        ):
            old[key].extend(
                item for item in value
                if item not in old[key]
            )

        else:
            old[key] = value

    return old



def normalize_text(value):

    return re.sub(
        r"\s+",
        " ",
        str(value).lower().strip()
    )



def split_words(value):

    return set(
        re.findall(
            r"[a-z0-9]+",
            normalize_text(
                value
            )
        )
    )



def values_match(left, right):

    left_text = normalize_text(
        left
    )

    right_text = normalize_text(
        right
    )

    if (
        left_text == right_text
        or left_text in right_text
        or right_text in left_text
    ):
        return True

    left_words = split_words(
        left_text
    )

    right_words = split_words(
        right_text
    )

    if not left_words or not right_words:
        return False

    return len(
        left_words & right_words
    ) >= min(
        len(left_words),
        len(right_words)
    )



def parse_memory_path(path):

    if isinstance(
        path,
        list
    ):
        return [
            str(part)
            for part in path
            if str(part).strip()
        ]

    if not isinstance(
        path,
        str
    ):
        return []

    path = path.replace(
        "/",
        "."
    )

    return [
        part.strip()
        for part in path.split(".")
        if part.strip()
    ]



def normalize_memory_operation(operation):

    if not isinstance(
        operation,
        dict
    ):
        return None

    action = normalize_text(
        operation.get(
            "action",
            ""
        )
    )

    action_aliases = {
        "append": "add",
        "create": "add",
        "edit": "update",
        "set": "update",
        "replace": "update",
        "delete": "remove",
        "forget": "remove"
    }

    action = action_aliases.get(
        action,
        action
    )

    if action not in [
        "add",
        "update",
        "remove"
    ]:
        return None

    path = parse_memory_path(
        operation.get(
            "path",
            []
        )
    )

    if not path:
        return None

    blocked_roots = [
        "system",
        "error",
        "response",
        "answer",
        "message",
        "assistant_response",
        "facts",
        "memory_operations",
        "operations"
    ]

    if normalize_text(
        path[0]
    ) in blocked_roots:
        return None

    return {
        "action": action,
        "path": path,
        "value": operation.get(
            "value",
            None
        )
    }



def normalize_memory_operations(operations):

    if isinstance(
        operations,
        dict
    ):
        operations = [
            operations
        ]

    if not isinstance(
        operations,
        list
    ):
        return []

    clean_operations = []

    for operation in operations:

        clean_operation = normalize_memory_operation(
            operation
        )

        if (
            clean_operation
            and clean_operation not in clean_operations
        ):

            clean_operations.append(
                clean_operation
            )

    return clean_operations



def should_update_memory(user_message):

    q = normalize_text(
        user_message
    )

    question_starts = [
        "what ",
        "who ",
        "when ",
        "where ",
        "why ",
        "how ",
        "which ",
        "do ",
        "does ",
        "did ",
        "can ",
        "could ",
        "are ",
        "is "
    ]

    mutation_markers = [
        "remember",
        "i am",
        "i'm",
        "my name is",
        "i have",
        "have a",
        "have an",
        "i own",
        "own a",
        "own an",
        "also own",
        "i bought",
        "bought a",
        "bought an",
        "i use",
        "i study",
        "i built",
        "i created",
        "i developed",
        "i designed",
        "i invented",
        "i won",
        "won ",
        "awarded",
        "not won",
        "did not win",
        "didn't win",
        "not been awarded",
        "was not awarded",
        "wasn't awarded",
        "not awarded",
        "never won",
        "don't own",
        "dont own",
        "do not own",
        "no longer",
        "remove",
        "delete",
        "forget",
        "change",
        "update",
        "edit",
        "replace",
        "correct"
    ]

    has_mutation = any(
        marker in q
        for marker in mutation_markers
    )

    if not has_mutation:
        return False

    if any(
        q.startswith(
            start
        )
        for start in question_starts
    ) and not any(
        marker in q
        for marker in [
            "remove",
            "delete",
            "forget",
            "change",
            "update",
            "edit",
            "replace",
            "correct"
        ]
    ):
        return False

    return True



def get_path_parent(data, path, create=False):

    parts = parse_memory_path(
        path
    )

    if not parts:
        return None, None

    current = data

    for part in parts[:-1]:

        if not isinstance(
            current,
            dict
        ):
            return None, None

        if part not in current:

            if not create:
                return None, None

            current[part] = {}

        current = current[part]

    return current, parts[-1]



def remove_value(target, value=None):

    changed = False

    if isinstance(
        target,
        list
    ):

        original = list(
            target
        )

        if value is None:
            target.clear()
        else:
            target[:] = [
                item
                for item in target
                if not (
                    values_match(
                        item,
                        value
                    )
                    or (
                        isinstance(
                            item,
                            dict
                        )
                        and any(
                            field in item
                            and values_match(
                                item[field],
                                value
                            )
                            for field in [
                                "name",
                                "title",
                                "description"
                            ]
                        )
                    )
                )
            ]

        return target != original

    if isinstance(
        target,
        dict
    ):

        for key in list(target.keys()):

            item = target[key]

            if value is None or values_match(
                key,
                value
            ) or (
                not isinstance(
                    item,
                    (dict, list)
                )
                and values_match(
                    item,
                    value
                )
            ):

                target.pop(
                    key,
                    None
                )

                changed = True

            elif isinstance(
                item,
                (dict, list)
            ):

                changed = remove_value(
                    item,
                    value
                ) or changed

        return changed

    return False



def apply_memory_operation(memory, operation):

    action = normalize_text(
        operation.get(
            "action",
            ""
        )
    )

    path = operation.get(
        "path",
        []
    )

    value = operation.get(
        "value",
        None
    )

    if action in [
        "add",
        "append",
        "create"
    ]:

        parent, key = get_path_parent(
            memory,
            path,
            create=True
        )

        if parent is None:
            return False

        if key not in parent:
            parent[key] = [] if not isinstance(value, dict) else {}

        if isinstance(
            parent[key],
            list
        ):

            values = value if isinstance(
                value,
                list
            ) else [
                value
            ]

            for item in values:

                if item not in parent[key]:

                    parent[key].append(
                        item
                    )

            return True

        if isinstance(
            parent[key],
            dict
        ) and isinstance(
            value,
            dict
        ):

            parent[key] = deep_merge(
                parent[key],
                value
            )

            return True

        parent[key] = value
        return True

    if action in [
        "edit",
        "update",
        "set",
        "replace"
    ]:

        parent, key = get_path_parent(
            memory,
            path,
            create=True
        )

        if parent is None:
            return False

        parent[key] = value
        return True

    if action in [
        "remove",
        "delete",
        "forget"
    ]:

        parent, key = get_path_parent(
            memory,
            path,
            create=False
        )

        if parent is not None and key in parent:

            if value is None:

                parent.pop(
                    key,
                    None
                )

                return True

            if not isinstance(
                parent[key],
                (dict, list)
            ):

                if values_match(
                    parent[key],
                    value
                ):

                    parent.pop(
                        key,
                        None
                    )

                    return True

                return False

            return remove_value(
                parent[key],
                value
            )

        return remove_value(
            memory,
            value
        )

    return False



def apply_memory_operations(memory, operations):

    changed = False

    for operation in normalize_memory_operations(
        operations
    ):

        changed = apply_memory_operation(
            memory,
            operation
        ) or changed

    return changed



def normalize_vehicle_name(name):

    words = re.findall(
        r"[A-Za-z0-9]+",
        name
    )

    return " ".join(
        word.upper()
        if word.isupper() or any(char.isdigit() for char in word)
        else word.capitalize()
        for word in words
    ).strip()



def extract_vehicle_facts(user_message):

    q = user_message.lower()

    if not any(
        keyword in q
        for keyword in [
            "own",
            "bought",
            "have",
            "drive"
        ]
    ):
        return {}

    vehicle_patterns = [
        (
            "cars",
            r"\bcar\s+of\s+brand\s+([a-z0-9]+)\s+model\s+([a-z0-9]+)"
        ),
        (
            "cars",
            r"\bcar\s+brand\s+([a-z0-9]+)\s+model\s+([a-z0-9]+)"
        ),
        (
            "cars",
            r"\b(?:car|cars)\s+(?:named|called)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)"
        ),
        (
            "bikes",
            r"\b(?:bike|bikes)\s+(?:named|called)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)"
        )
    ]

    vehicles = {
        "bikes": [],
        "cars": []
    }

    for vehicle_type, pattern in vehicle_patterns:

        for match in re.finditer(
            pattern,
            q,
            re.IGNORECASE
        ):

            name = normalize_vehicle_name(
                " ".join(match.groups())
            )

            if name and name not in vehicles[vehicle_type]:

                vehicles[vehicle_type].append(
                    name
                )

    vehicles = {
        key: value
        for key, value in vehicles.items()
        if value
    }

    if not vehicles:
        return {}

    return {
        "vehicles": vehicles
    }



def extract_vehicle_operations(user_message):

    q = user_message.lower()

    add_words = [
        "own",
        "bought",
        "have",
        "drive"
    ]

    remove_words = [
        "don't own",
        "dont own",
        "do not own",
        "no longer own",
        "not own",
        "sold",
        "removed",
        "remove",
        "forget"
    ]

    should_add = any(
        word in q
        for word in add_words
    )

    should_remove = any(
        word in q
        for word in remove_words
    )

    if not should_add and not should_remove:
        return []

    vehicle_patterns = [
        (
            "cars",
            r"\bcar\s+of\s+brand\s+([a-z0-9]+)\s+model\s+([a-z0-9]+)"
        ),
        (
            "cars",
            r"\bcar\s+brand\s+([a-z0-9]+)\s+model\s+([a-z0-9]+)"
        ),
        (
            "cars",
            r"\b(?:car|cars)\s+(?:named|called)?\s*([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)"
        ),
        (
            "bikes",
            r"\b(?:bike|bikes)\s+(?:named|called)?\s*([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)"
        )
    ]

    operations = []

    action = "remove" if should_remove else "add"

    for vehicle_type, pattern in vehicle_patterns:

        for match in re.finditer(
            pattern,
            q,
            re.IGNORECASE
        ):

            name = normalize_vehicle_name(
                " ".join(match.groups())
            )

            if not name:
                continue

            operations.append(
                {
                    "action": action,
                    "path": [
                        "vehicles",
                        vehicle_type
                    ],
                    "value": name
                }
            )

    return operations



def facts_to_add_operations(facts, prefix=None):

    if prefix is None:
        prefix = []

    operations = []

    if isinstance(
        facts,
        dict
    ):

        for key, value in facts.items():

            path = prefix + [
                key
            ]

            if isinstance(
                value,
                dict
            ):

                operations.append(
                    {
                        "action": "add",
                        "path": path,
                        "value": value
                    }
                )

            elif isinstance(
                value,
                list
            ):

                for item in value:

                    operations.append(
                        {
                            "action": "add",
                            "path": path,
                            "value": item
                        }
                    )

            else:

                operations.append(
                    {
                        "action": "update",
                        "path": path,
                        "value": value
                    }
                )

    return operations



def find_list_value_operations(data, text, action, path=None):

    if path is None:
        path = []

    operations = []

    if isinstance(
        data,
        dict
    ):

        for key, value in data.items():

            operations.extend(
                find_list_value_operations(
                    value,
                    text,
                    action,
                    path + [
                        key
                    ]
                )
            )

    elif isinstance(
        data,
        list
    ):

        for item in data:

            item_matches = False

            if isinstance(
                item,
                dict
            ):

                for field in [
                    "name",
                    "title",
                    "description"
                ]:

                    if (
                        field in item
                        and normalize_text(
                            item[field]
                        ) in text
                    ):

                        item_matches = True
                        break

            elif not isinstance(
                item,
                list
            ) and normalize_text(
                item
            ) in text:

                item_matches = True

            if item_matches:

                operations.append(
                    {
                        "action": action,
                        "path": path,
                        "value": item
                    }
                )

    return operations



def find_matching_value_operations(data, text, action, path=None):

    if path is None:
        path = []

    operations = []

    if isinstance(
        data,
        dict
    ):

        for key, value in data.items():

            current_path = path + [
                key
            ]

            if isinstance(
                value,
                (dict, list)
            ):

                operations.extend(
                    find_matching_value_operations(
                        value,
                        text,
                        action,
                        current_path
                    )
                )

            elif normalize_text(
                value
            ) in text:

                operations.append(
                    {
                        "action": action,
                        "path": current_path,
                        "value": value
                    }
                )

    elif isinstance(
        data,
        list
    ):

        for item in data:

            item_matches = False

            if isinstance(
                item,
                dict
            ):

                for field in [
                    "name",
                    "title",
                    "description"
                ]:

                    if (
                        field in item
                        and normalize_text(
                            item[field]
                        ) in text
                    ):

                        item_matches = True
                        break

            elif not isinstance(
                item,
                list
            ) and normalize_text(
                item
            ) in text:

                item_matches = True

            if item_matches:

                operations.append(
                    {
                        "action": action,
                        "path": path,
                        "value": item
                    }
                )

    return operations



def clean_captured_value(value):

    value = re.split(
        r"\b(?:and|but|because|though|however)\b",
        value,
        maxsplit=1,
        flags=re.IGNORECASE
    )[0]

    return normalize_vehicle_name(
        value
    )



def extract_common_add_operations(user_message):

    q = user_message.lower()
    original = user_message.strip()

    if any(
        phrase in q
        for phrase in [
            "not ",
            "don't",
            "dont",
            "do not",
            "did not",
            "didn't",
            "no longer",
            "never",
            "remove",
            "delete",
            "forget"
        ]
    ):
        return []

    operations = []

    profile_patterns = [
        (
            r"\b(?:i am|i'm)\s+(male|female|nonbinary|non-binary)\b",
            [
                "gender"
            ]
        ),
        (
            r"\b(?:i am|i'm)\s+(\d{1,3})\s*(?:years old|year old|yrs old|yr old|yo)\b",
            [
                "age"
            ]
        ),
        (
            r"\bmy age is\s+(\d{1,3})\b",
            [
                "age"
            ]
        ),
        (
            r"\bmy gender is\s+([a-zA-Z -]+?)(?:[.!?]|$)",
            [
                "gender"
            ]
        ),
        (
            r"\bmy name is\s+([a-zA-Z][a-zA-Z\s.-]*?)(?:[.!?]|$)",
            [
                "name"
            ]
        ),
        (
            r"\b(?:i am from|i live in|my country is)\s+([a-zA-Z][a-zA-Z\s.-]*?)(?:[.!?]|$)",
            [
                "country"
            ]
        ),
        (
            r"\b(?:i am a|i am an|i work as a|i work as an)\s+([a-zA-Z][a-zA-Z\s.-]*?)(?:[.!?]|$)",
            [
                "profession"
            ]
        ),
        (
            r"\b(?:i like|i love)\s+([a-zA-Z0-9][a-zA-Z0-9\s+.#-]*?)(?:[.!?]|$)",
            [
                "preferences",
                "likes"
            ]
        )
    ]

    for pattern, path in profile_patterns:

        for match in re.finditer(
            pattern,
            original,
            re.IGNORECASE
        ):

            value = match.group(
                1
            ).strip()

            if not value:
                continue

            if path == [
                "gender"
            ]:

                value = normalize_text(
                    value
                )

            elif path == [
                "age"
            ]:

                value = int(
                    value
                )

            elif path == [
                "preferences",
                "likes"
            ]:

                value = clean_captured_value(
                    value
                )

            else:

                value = " ".join(
                    word.capitalize()
                    for word in value.split()
                )

            operations.append(
                {
                    "action": "add"
                    if path == [
                        "preferences",
                        "likes"
                    ]
                    else "update",
                    "path": path,
                    "value": value
                }
            )

    if operations:
        return operations

    project_award_match = re.search(
        r"\b(?:i have won|i won|won)\s+[\"']?(.+?)[\"']?\s+with\s+project\s+(.+?)(?:[.!?]|$)",
        original,
        re.IGNORECASE
    )

    if project_award_match:

        award = project_award_match.group(
            1
        ).strip(
            " \"'"
        )

        project_text = project_award_match.group(
            2
        )

        project_names = [
            project.strip(
                " \"'"
            )
            for project in re.split(
                r",|\band\b",
                project_text,
                flags=re.IGNORECASE
            )
            if project.strip(
                " \"'"
            )
        ]

        for project_name in project_names:

            operations.append(
                {
                    "action": "add",
                    "path": [
                        "projects",
                        project_name,
                        "awards"
                    ],
                    "value": award
                }
            )

        if operations:
            return operations

    add_patterns = [
        (
            r"\b(?:my phone is|i have a phone|i use a phone|phone named|phone called)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)",
            [
                "devices",
                "phones"
            ]
        ),
        (
            r"\b(?:my computer is|i have a computer|i use a computer|computer named|computer called)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)",
            [
                "devices",
                "computers"
            ]
        ),
        (
            r"\b(?:i use|i have|using)\s+(esp32|arduino|raspberry pi|stm32)\b",
            [
                "devices",
                "microcontrollers"
            ]
        ),
        (
            r"\b(?:i am studying|i study|i am learning|i am researching|researching|learning)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)",
            [
                "research_topics"
            ]
        ),
        (
            r"\b(?:i won|won|i was awarded|awarded)\s+([a-z0-9][a-z0-9\s-]*?)(?:[.!?]|$)",
            [
                "achievements"
            ]
        )
    ]

    for pattern, path in add_patterns:

        for match in re.finditer(
            pattern,
            q,
            re.IGNORECASE
        ):

            value = clean_captured_value(
                match.group(1)
            )

            if not value:
                continue

            if path == [
                "research_topics"
            ]:

                value = {
                    "name": value,
                    "subtopics": []
                }

            operations.append(
                {
                    "action": "add",
                    "path": path,
                    "value": value
                }
            )

    return operations



def extract_common_remove_operations(user_message):

    original = user_message.strip()

    operations = []

    profile_remove_patterns = [
        (
            r"\b(?:i am not|i'm not|i am no longer|i'm no longer)\s+(male|female|nonbinary|non-binary)\b",
            [
                "gender"
            ]
        ),
        (
            r"\b(?:i am not|i'm not|i am no longer|i'm no longer)\s+(\d{1,3})\s*(?:years old|year old|yrs old|yr old|yo)\b",
            [
                "age"
            ]
        ),
        (
            r"\bmy age is not\s+(\d{1,3})\b",
            [
                "age"
            ]
        ),
        (
            r"\bmy gender is not\s+([a-zA-Z -]+?)(?:[.!?]|$)",
            [
                "gender"
            ]
        ),
        (
            r"\b(?:i am not from|i no longer live in|i don't live in|i dont live in)\s+([a-zA-Z][a-zA-Z\s.-]*?)(?:[.!?]|$)",
            [
                "country"
            ]
        ),
        (
            r"\b(?:i am not a|i am not an|i no longer work as a|i no longer work as an)\s+([a-zA-Z][a-zA-Z\s.-]*?)(?:[.!?]|$)",
            [
                "profession"
            ]
        )
    ]

    for pattern, path in profile_remove_patterns:

        for match in re.finditer(
            pattern,
            original,
            re.IGNORECASE
        ):

            value = match.group(
                1
            ).strip()

            if not value:
                continue

            if path == [
                "gender"
            ]:

                value = normalize_text(
                    value
                )

            elif path == [
                "age"
            ]:

                value = int(
                    value
                )

            else:

                value = " ".join(
                    word.capitalize()
                    for word in value.split()
                )

            operations.append(
                {
                    "action": "remove",
                    "path": path,
                    "value": value
                }
            )

    return operations



def extract_local_memory_operations(user_message):

    q = normalize_text(
        user_message
    )

    operations = extract_vehicle_operations(
        user_message
    )

    operations.extend(
        extract_common_add_operations(
            user_message
        )
    )

    operations.extend(
        extract_common_remove_operations(
            user_message
        )
    )

    remove_requested = any(
        phrase in q
        for phrase in [
            "don't own",
            "dont own",
            "do not own",
            "no longer own",
            "not won",
            "did not win",
            "didn't win",
            "not been awarded",
            "was not awarded",
            "wasn't awarded",
            "not awarded",
            "never won",
            "i have not",
            "i haven't",
            "i dont have",
            "i don't have",
            "do not have",
            "not have",
            "not using",
            "don't use",
            "dont use",
            "do not use",
            "no longer use",
            "stopped using",
            "not studying",
            "don't study",
            "dont study",
            "do not study",
            "no longer study",
            "remove",
            "delete",
            "forget",
            "not my",
            "isn't mine",
            "is not mine"
        ]
    )

    if remove_requested:

        operations.extend(
            find_matching_value_operations(
                load_long_term_memory(),
                q,
                "remove"
            )
        )

    return operations













   
def get_all_projects():

    try:

        with open(
            PROJECTS_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            projects = json.load(f)

        return "\n".join(
            projects.keys()
        )

    except:

        return ""
   


import re

def build_projects_json():

    projects = {}

    for file in os.listdir(KNOWLEDGE_FOLDER):

        if file.endswith(".txt"):

            name = file.replace(".txt", "")

            spaced_name = (
                name
                .replace("_", " ")
                .replace("-", " ")
                .lower()
            )

            projects[name] = {
                "file": os.path.join(
                    KNOWLEDGE_FOLDER,
                    file
                ),
                "keywords": [
                    name.lower(),
                    spaced_name
                ]
            }

    return projects



    
def load_profile():

    try:

        with open(
            PROFILE_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            profile = json.load(f)

        important = {
            "name": profile.get("name"),
            "profession": profile.get("profession"),
            "skills": profile.get("skills"),
            "devices": profile.get("devices"),
            "vehicles": profile.get("vehicles"),
            "current_goal": profile.get("current_goal")
        }

        return json.dumps(
            important,
            indent=2
        )[:500]

    except Exception:
        return ""









# ==========================================
# LOAD NOTES
# ==========================================




def load_notes():

    try:

        with open(
            NOTES_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            text = f.read()

        return text[-1000:]

    except:
        return ""







# ==========================================
# BUILD SYSTEM MESSAGE
# ==========================================



def build_system_message():
    DEBUG = False

    if DEBUG:
        print(...)

    return {
        "role": "system",
        "content":
        SYSTEM_PROMPT
        + "\n\nUSER PROFILE:\n"
        + load_profile()
        + "\n\nUSER NOTES:\n"
        + load_notes()
        + "\n\nLONG TERM MEMORY:\n"
        + memory_context()[:1500]
    }
    
    
    
def get_project_context(question):

    q = question.lower()

    try:

        with open(
            PROJECTS_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            projects = json.load(f)

        contexts = []

        for project_name, project_data in projects.items():

            keywords = project_data.get(
                "keywords",
                []
            )

            if any(
                re.search(
                    rf"\b{re.escape(keyword.lower())}\b",
                    q
                )
                for keyword in keywords
            ):

                file_path = project_data.get(
                    "file",
                    ""
                )

                if os.path.exists(file_path):

                    with open(
                        file_path,
                        "r",
                        encoding="utf-8"
                    ) as pf:

                        contexts.append(
                            f"\n--- {project_name} ---\n"
                            + pf.read()[:1000]
                        )

        return "\n".join(contexts)

    except Exception as e:

        print(
            f"\nPROJECT ERROR: {e}"
        )

        return ""








def get_research_context(question):

    q = question.lower()

    contexts = []

    try:

        for file in os.listdir(
            RESEARCH_FOLDER
        ):

            if not file.endswith(".txt"):
                continue

            name = file.replace(
                ".txt",
                ""
            )

            if name.lower() in q:

                with open(
                    os.path.join(
                        RESEARCH_FOLDER,
                        file
                    ),
                    "r",
                    encoding="utf-8"
                ) as f:

                    contexts.append(
                        f"\n--- {name} ---\n"
                        + f.read()[:1000]
                    )

        return "\n".join(contexts)

    except:

        return ""




# ==========================================
# MEMORY
# ==========================================


def load_memory():

    try:

        with open(
            CHAT_MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            messages = json.load(f)
            print("\nLOADED MESSAGES:")
            print(len(messages))


            for i, msg in enumerate(messages):
                print(i, msg["role"], len(msg["content"]))


        # Always refresh system prompt
        if messages:
            messages[0] = build_system_message()
        else:
            messages = [
                build_system_message()
            ]
        

        return messages

    except:

        return [
            build_system_message()
        ]







def save_memory(messages):

    with open(
        CHAT_MEMORY_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            messages,
            f,
            indent=4
        )

# ==========================================
# COMMANDS
# ==========================================

def handle_command(command, messages):

    command = command.strip()

    if command.lower() == "exit":

        print("\nAIRIS: Goodbye.")
        return "exit"

    if command.lower() == "cls":

        os.system(
            "cls"
            if os.name == "nt"
            else "clear"
        )

        return True

    if command.lower() == "time":

        print(
            "\nAIRIS:",
            datetime.now().strftime(
                "%I:%M:%S %p"
            )
        )

        return True

    if command.lower() == "forget":

        messages.clear()
        messages.append(
            build_system_message()
        )

        save_memory(messages)

        print(
            "\nAIRIS: Memory cleared."
        )

        return True

    if command.lower().startswith(
        "remember "
    ):

        note = command[9:]

        operations = extract_local_memory_operations(
            note
        )

        if operations:

            save_memory_operations(
                operations
            )

            print(
                "\nAIRIS: Profile memory saved."
            )

            return True

        with open(
            NOTES_FILE,
            "a",
            encoding="utf-8"
        ) as f:

            f.write(note + "\n")

        print(
            "\nAIRIS: Memory saved."
        )

        return True
    
    
    
    if command.lower().startswith(
        "search "
    ):

        query = command[7:]

        print(
            "\nAIRIS: Searching internet..."
        )

        result = search_web(
            query
        )

        print(
            "\n" + result
        )

        return True

    if command.lower().startswith(
        "calc "
    ):

        try:

            result = eval(
                command[5:],
                {"__builtins__": {}},
                {}
            )

            print(
                "\nAIRIS:",
                result
            )

        except:

            print(
                "\nAIRIS: Invalid expression."
            )

        return True

    if command.lower().startswith(
        "mkdir "
    ):

        folder = command[6:].strip()

        try:

            os.makedirs(
                folder,
                exist_ok=True
            )

            print(
                f"\nAIRIS: Folder '{folder}' created."
            )

        except Exception as e:

            print(
                f"\nAIRIS: {e}"
            )

        return True

    return False





def load_long_term_memory():

    try:
        with open(
            LONG_TERM_MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as f:
            return json.load(f)

    except:
        return {}



def save_long_term_memory(memory):

    save_json_file(
        LONG_TERM_MEMORY_FILE,
        memory
    )



def load_json_file(file_path, default):

    try:

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as f:

            return json.load(
                f
            )

    except:

        return default



def save_json_file(file_path, data):

    temp_path = file_path + ".tmp"

    with open(
        temp_path,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            data,
            f,
            indent=4
        )

    os.replace(
        temp_path,
        file_path
    )



def sync_user_profile_from_memory(memory):

    profile = load_json_file(
        PROFILE_FILE,
        {}
    )

    profile_synced_keys = [
        "name",
        "preferred_name",
        "gender",
        "age",
        "country",
        "profession",
        "education",
        "vehicles",
        "devices",
        "skills",
        "achievements",
        "preferences"
    ]

    for key in profile_synced_keys:

        if key in memory:

            profile[key] = memory[key]

        elif key in profile:

            profile.pop(
                key,
                None
            )

    if "research_topics" in memory:

        profile["technical_interests"] = [
            topic.get(
                "name",
                topic
            )
            if isinstance(
                topic,
                dict
            )
            else topic
            for topic in memory["research_topics"]
        ]

    save_json_file(
        PROFILE_FILE,
        profile
    )



def sync_sidecar_memory_files(memory):

    sync_user_profile_from_memory(
        memory
    )

    if "achievements" in memory:

        update_achievements(
            memory.get(
                "achievements",
                []
            )
        )

    if "projects" in memory:

        for project, info in memory.get(
            "projects",
            {}
        ).items():

            file_path = os.path.join(
                KNOWLEDGE_FOLDER,
                f"{project}.txt"
            )

            if not os.path.exists(
                file_path
            ):

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as f:

                    json.dump(
                        info,
                        f,
                        indent=4
                    )

            else:

                try:

                    with open(
                        file_path,
                        "r",
                        encoding="utf-8"
                    ) as f:

                        json.load(
                            f
                        )

                    save_json_file(
                        file_path,
                        info
                    )

                except:

                    pass

        sync_projects()



def unique_list(items):

    result = []

    for item in items:

        if item not in result:

            result.append(
                item
            )

    return result



def normalize_memory_after_operations(memory):

    if not isinstance(
        memory,
        dict
    ):
        return memory

    memory.pop(
        "error",
        None
    )

    projects = memory.setdefault(
        "projects",
        {}
    )

    if isinstance(
        projects,
        dict
    ):

        for project_name, project_info in list(projects.items()):

            if not isinstance(
                project_info,
                dict
            ):

                projects[project_name] = {
                    "description": str(
                        project_info
                    ),
                    "status": "active",
                    "technologies": [],
                    "awards": []
                }

                project_info = projects[project_name]

            project_info.setdefault(
                "description",
                ""
            )

            project_info.setdefault(
                "status",
                "active"
            )

            project_info.setdefault(
                "technologies",
                []
            )

            project_info.setdefault(
                "awards",
                []
            )

            if isinstance(
                project_info["awards"],
                list
            ):

                project_info["awards"] = unique_list(
                    project_info["awards"]
                )

    achievements = memory.setdefault(
        "achievements",
        []
    )

    if not isinstance(
        achievements,
        list
    ):

        achievements = [
            achievements
        ]

    derived_achievements = []

    if isinstance(
        projects,
        dict
    ):

        for project_name, project_info in projects.items():

            if not isinstance(
                project_info,
                dict
            ):
                continue

            for award in project_info.get(
                "awards",
                []
            ):

                derived_achievements.append(
                    f"Won {award} with {project_name} project"
                )

    cleaned_achievements = []

    for achievement in achievements:

        derived_match = re.match(
            r"^Won .+ with .+ project$",
            str(achievement)
        )

        if derived_match and achievement not in derived_achievements:
            continue

        cleaned_achievements.append(
            achievement
        )

    memory["achievements"] = unique_list(
        cleaned_achievements
        + [
            achievement
            for achievement in derived_achievements
            if achievement not in cleaned_achievements
        ]
    )

    for key in [
        "vehicles",
        "devices",
        "people",
        "studies",
        "organizations"
    ]:

        if key in memory and memory[key] is None:

            memory[key] = {}

    if "research_topics" in memory and not isinstance(
        memory["research_topics"],
        list
    ):

        memory["research_topics"] = [
            memory["research_topics"]
        ]

    return memory



def save_local_facts(facts):

    if not facts:
        return False

    memory = load_long_term_memory()

    memory.pop(
        "error",
        None
    )

    memory = deep_merge(
        memory,
        facts
    )

    memory = normalize_memory_after_operations(
        memory
    )

    save_long_term_memory(
        memory
    )

    sync_sidecar_memory_files(
        memory
    )

    return True



def save_memory_operations(operations):

    if not operations:
        return False

    memory = load_long_term_memory()

    memory.pop(
        "error",
        None
    )

    changed = apply_memory_operations(
        memory,
        operations
    )

    if not changed:
        return False

    memory = normalize_memory_after_operations(
        memory
    )

    save_long_term_memory(
        memory
    )

    sync_sidecar_memory_files(
        memory
    )

    return True





def update_memory(
    client,
    user_message
):

    try:

        local_operations = extract_local_memory_operations(
            user_message
        )

        if local_operations:

            save_memory_operations(
                local_operations
            )

            print("\nLOCAL MEMORY UPDATED:")
            print(
                json.dumps(
                    local_operations,
                    indent=4
                )
            )

        memory_operations = []
        facts = {}

        response = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            # model="llama-3.3-70b-versatile",
            # model="meta-llama/llama-4-scout-17b-16e-instruct",
            
            messages=[
                {
                    "role": "system",
                    "content": """

Return ONLY valid JSON.

Analyze whether the user is adding, editing, correcting, or removing long-term memory.
If the user is only asking a question, return {}.
Never store assistant replies, refusals, temporary chat, or guesses.

For add, edit, or remove requests, prefer this operation format:

{
"memory_operations": [
{
"action": "add | update | remove",
"path": ["top_level_key", "nested_key"],
"value": "value to add, set, or remove"
}
]
}

Use the same memory_operations format for ALL memory areas:
* user profile fields such as name, education, devices, vehicles, skills, preferences
* projects and project fields
* project awards and achievements
* research topics and subtopics
* people and relationships
* studies
* organizations
* knowledge items
* any future top-level memory key the user clearly asks to store

Operation rules:
* add: append to a list, merge into an object, or create a new field.
* update: replace the exact field at path with value.
* remove: remove the value from a list/object, or remove the whole field if value is null.
* Use the most specific path possible.
* If the user negates a previous fact, use remove.
* If the user corrects a previous fact, use update or remove + add.
* If the request is ambiguous, return {} instead of guessing.

Use memory_operations when the user says things like:
* "I don't own..."
* "remove..."
* "forget..."
* "edit..."
* "change..."
* "update..."
* "replace..."
* "I no longer..."
* "I have not won..."
* "I was not awarded..."
* "I don't use..."
* "I am not studying..."
* "Correct..."

Examples:

User:
"I don't own Suzuki Zxi."

Return:

{
"memory_operations": [
{
"action": "remove",
"path": ["vehicles", "cars"],
"value": "Suzuki Zxi"
}
]
}

User:
"I have not won 8th PEC Tech Expo and was not awarded there."

Return:

{
"memory_operations": [
{
"action": "remove",
"path": ["projects", "Air Mouse", "awards"],
"value": "8th PEC Tech Expo"
}
]
}

User:
"Change Swift Ignite status to completed."

Return:

{
"memory_operations": [
{
"action": "update",
"path": ["projects", "Swift Ignite", "status"],
"value": "completed"
}
]
}

User:
"Remove ROS2 from my research topics."

Return:

{
"memory_operations": [
{
"action": "remove",
"path": ["research_topics"],
"value": "ROS2"
}
]
}

Projects must ALWAYS be stored as:

{
"projects": {
"Project Name": {
"description": "",
"status": "active",
"technologies": [],
"awards": []
}
}
}

Vehicles must be stored as:

{
"vehicles": {
"bikes": [],
"cars": []
}
}

Vehicle Extraction Rules:

Store vehicles the user owns, buys, drives regularly, or explicitly says belong to them.

Examples:

User:
"I own a Yamaha Fascino."

Return:

{
"vehicles": {
"bikes": [
"Yamaha Fascino"
]
}
}

User:
"I also own a Super Splendor."

Return:

{
"vehicles": {
"bikes": [
"Super Splendor"
]
}
}

User:
"I bought a Honda City."

Return:

{
"vehicles": {
"cars": [
"Honda City"
]
}
}

Devices must be stored as:

{
"devices": {
"phones": [],
"computers": [],
"microcontrollers": []
}
}

Achievements must be stored as:

{
"achievements": []
}

Skills must be stored as:

{
"skills": []
}

Research topics must be stored as:

{
"research_topics": [
{
"name": "",
"subtopics": []
}
]
}

Projects must ONLY be created when the user explicitly mentions:

* building
* creating
* developing
* designing
* inventing
* working on

a project.

Do NOT store:

* vehicles as projects
* devices as projects
* awards as projects
* companies as projects
* schools as projects
* products owned as projects
* assistant responses
* assistant opinions
* temporary conversations
* question-answer pairs
* "response" fields
* "facts" fields
* null values
* empty strings
* duplicate entries

Research Topic Rules:

1. Store subjects the user is studying, learning, researching, or deeply interested in.
2. Never create a project from a research topic.
3. Avoid duplicates.
4. A research topic represents ONE overall area of study.
5. Related features belong in subtopics.
6. Do NOT split one research goal into multiple research topics.
7. Do NOT create separate topics for individual features.
8. Use subtopics for features, methods, and components.
9. Use short names.
10. Do not store full sentences.
11. Merge matching topics instead of creating duplicates.
12. Return only JSON.

Example:

User:
"I am researching GPS tracking, AI mileage detection, theft detection and remote engine shutdown for Swift Ignite."

Return:

{
"research_topics": [
{
"name": "GPS Tracking for Swift Ignite",
"subtopics": [
"AI Mileage Detection",
"Theft Detection",
"Remote Engine Shutdown"
]
}
]
}

User:
"I am studying ROS2 and Computer Vision."

Return:

{
"research_topics": [
{
"name": "ROS2",
"subtopics": []
},
{
"name": "Computer Vision",
"subtopics": []
}
]
}

If no useful long-term information exists:

{}

"""









                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],

            temperature=0,
            max_tokens=500
        )

        import re

        text = (
            response
            .choices[0]
            .message
            .content
            .strip()
        )

        print("\nRAW MEMORY RESPONSE:")
        print(text)

        if not text:

            print("\nEMPTY MEMORY RESPONSE")

            import re

            study_match = re.findall(
                r"(?:studying|learning|researching|research on)\s+(.+)",
                user_message,
                re.IGNORECASE
            )

            if study_match:

                facts = {
                    "research_topics": [
                        {
                            "name": study_match[0],
                            "subtopics": []
                        }
                    ]
                }

                text = json.dumps(
                    facts
                )

            else:
                return



        text = text.strip()

        # Remove markdown code fences
        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

        text = text.strip()
                

        match = re.search(
            r"\{.*\}",
            text,
            re.DOTALL
        )






        if match:

            try:

                facts = json.loads(
                    match.group()
                )

            except json.JSONDecodeError:

                facts = {}






            # Remove junk AI response fields

            facts.pop(
                "response",
                None
            )

            facts.pop(
                "answer",
                None
            )

            facts.pop(
                "message",
                None
            )

            facts.pop(
                "assistant_response",
                None
            )

            facts.pop(
                "error",
                None
            )

            memory_operations = facts.pop(
                "memory_operations",
                facts.pop(
                    "operations",
                    []
                )
            )

            memory_operations = normalize_memory_operations(
                memory_operations
            )








        else:

            facts = {}


        facts.pop(
            "facts",
            None
        )

        facts.pop(
            "error",
            None
        )

        memory_operations = locals().get(
            "memory_operations",
            []
        )

        memory_operations = normalize_memory_operations(
            memory_operations
        )

        if facts:

            memory_operations.extend(
                facts_to_add_operations(
                    facts
                )
            )

            memory_operations = normalize_memory_operations(
                memory_operations
            )

        if local_operations:

            memory_operations = [
                operation
                for operation in memory_operations
                if operation not in local_operations
            ]

            if any(
                operation.get(
                    "action"
                ) == "remove"
                for operation in local_operations
            ):

                memory_operations = [
                    operation
                    for operation in memory_operations
                    if operation.get(
                        "action"
                    ) in [
                        "remove",
                        "delete",
                        "forget",
                        "update",
                        "edit",
                        "set",
                        "replace"
                    ]
                ]

        print("\nPARSED FACTS:")
        print(
            json.dumps(
                facts,
                indent=4
            )
        )

        if not facts and not memory_operations:

            import re

            research_keywords = re.findall(
                r"research on (.+)",
                user_message,
                re.IGNORECASE
            )

            if research_keywords:

                memory_operations = [
                    {
                        "action": "add",
                        "path": [
                            "research_topics"
                        ],
                        "value": {
                            "name": research_keywords[0],
                            "subtopics": []
                        }
                    }
                ]

            else:
                return
        # ------------------------
        # Save long-term memory
        # ------------------------



        memory = load_long_term_memory()

        apply_memory_operations(
            memory,
            memory_operations
        )

        memory = normalize_memory_after_operations(
            memory
        )

        print("\nUPDATED MEMORY:")
        print(
            json.dumps(
                memory,
                indent=4
            )
        )

        save_long_term_memory(
            memory
        )
        sync_sidecar_memory_files(
            memory
        )
        if "achievements" in facts:

            update_achievements(
                facts["achievements"]
            )
        # ------------------------
        # Save project files
        # ------------------------




        research_topics = facts.get(
            "research_topics",
            []
        )







        for topic in research_topics:

            topic_name = topic.get(
                "name",
                "Unknown"
            )

            subtopics = topic.get(
                "subtopics",
                []
            )

            safe_name = (
                topic_name
                .replace("/", "-")
                .replace("\\", "-")
                .strip()
            )

            file_path = os.path.join(
                RESEARCH_FOLDER,
                f"{safe_name}.txt"
            )

            if not os.path.exists(
                file_path
            ):

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as f:

                    f.write(
                        f"Research Topic: {topic_name}\n\n"
                    )

                    if subtopics:

                        f.write(
                            "Subtopics:\n"
                        )

                        for subtopic in subtopics:

                            f.write(
                                f"- {subtopic}\n"
                            )




        # ------------------------
        # Save project files
        # ------------------------

        projects = facts.get(
            "projects",
            {}
        )

        for project, info in projects.items():

            file_path = os.path.join(
                KNOWLEDGE_FOLDER,
                f"{project}.txt"
            )

            if not os.path.exists(
                file_path
            ):

                print(
                    f"Creating project file: {file_path}"
                )

                with open(
                    file_path,
                    "w",
                    encoding="utf-8"
                ) as f:

                    json.dump(
                        info,
                        f,
                        indent=4
                    )

        sync_projects()

        print("\nMEMORY UPDATED:")
        print(
            json.dumps(
                facts,
                indent=4
            )
        )

    except Exception as e:

        if "429" in str(e):

            print(
                "\nAIRIS: Memory update skipped (rate limit reached)."
            )

            return

        print(
            f"\nMEMORY ERROR: {e}"
        )


def update_achievements(
    achievements_list
):

    data = load_json_file(
        ACHIEVEMENTS_FILE,
        {
            "awards": [],
            "competitions": [],
            "certifications": []
        }
    )

    data["awards"] = []

    for achievement in achievements_list:

        if achievement not in data["awards"]:

            data["awards"].append(
                achievement
            )

    save_json_file(
        ACHIEVEMENTS_FILE,
        data
    )
        




def sync_projects():

    projects = {}

    if os.path.exists(PROJECTS_FILE):

        try:

            with open(
                PROJECTS_FILE,
                "r",
                encoding="utf-8"
            ) as f:

                projects = json.load(f)

        except (
            json.JSONDecodeError,
            FileNotFoundError
        ):

            projects = {}

    discovered = build_projects_json()

    for name, data in discovered.items():
        projects[name] = data

    with open(
        PROJECTS_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            projects,
            f,
            indent=4
        )









def memory_context():

    try:

        with open(
            LONG_TERM_MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            memory = json.load(f)

        # Limit memory sent to model
        return json.dumps(
            memory,
            indent=2
        )[:300]
        
        
        
        
    except:

        return "{}"









def save_conversation_history(
    question,
    answer
):

    try:

        with open(
            HISTORY_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            history = json.load(f)

    except:

        history = []

    history.append(
        {
            "time":
            datetime.now().strftime(
                "%Y-%m-%d %H:%M:%S"
            ),
            "user":
            question,
            "assistant":
            answer
        }
    )

    history = history[-20:]

    with open(
        HISTORY_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            history,
            f,
            indent=4
        )
        
        
# ==========================================
# AI RESPONSE
# ==========================================







def ask_airis(
    client,
    messages,
    question
):

    q = question.lower().strip()

    MAX_MESSAGES = 10

    if len(messages) > MAX_MESSAGES:

        messages[:] = (
            [messages[0]]
            + messages[-(MAX_MESSAGES - 1):]
        )

    web_context = ""

    for i, msg in enumerate(messages):

        print(
            f"\nMSG {i}:",
            len(msg["content"])
        )

    internet_keywords = [

        "latest",
        "today",
        "current",
        "news",
        "price",
        "weather",
        "president",
        "prime minister",
        "update",
        "release",
        "version"

    ]

    if should_update_memory(
        question
    ):

        update_memory(
            client,
            question
        )

    temp_messages = messages.copy()

    local_context = search_local_knowledge(
        question
    )

    if local_context:

        temp_messages.append(
            {
                "role": "system",
                "content":
                "Relevant personal knowledge:\n\n"
                + local_context
            }
        )

    project_context = get_project_context(
        question
    )

    if project_context:

        temp_messages.append(
            {
                "role": "system",
                "content":
                "Relevant project information:\n\n"
                + project_context
            }
        )

    research_context = get_research_context(
        question
    )

    if research_context:

        temp_messages.append(
            {
                "role": "system",
                "content":
                "Relevant research:\n\n"
                + research_context
            }
        )

    try:

        if any(
            keyword in q
            for keyword in internet_keywords
        ):

            print(
                "\nAIRIS: Searching internet..."
            )

            web_context = search_web(
                question
            )

            if (
                web_context
                and not web_context.startswith(
                    "Search Error"
                )
            ):

                temp_messages.append(
                    {
                        "role": "system",
                        "content":
                        "Use these web results:\n\n"
                        + web_context
                    }
                )

    except Exception as e:

        print(
            f"\nAIRIS Search Error: {e}"
        )

    temp_messages.append(
        {
            "role": "user",
            "content": question
        }
    )

    recent_messages = temp_messages

    lyrics_request = (
        "lyrics" in q
        and any(
            keyword in q
            for keyword in [
                "complete",
                "full",
                "clean",
                "entire",
                "all"
            ]
        )
    )

    if lyrics_request:

        answer = (
            "Sorry, I can't provide complete song lyrics. "
            "I can summarize the song, explain its meaning, or help with a short excerpt."
        )

    else:

        try:

            response = client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=recent_messages,
                temperature=0.7,
                max_tokens=900
            )

            answer = (
                response
                .choices[0]
                .message
                .content
                .strip()
            )

            if not answer:

                answer = "I could not generate a response. Please try again."

        except Exception as e:

            if "429" in str(e) or "rate_limit" in str(e).lower():

                answer = (
                    "Your profile memory was saved locally, but the AI response "
                    "is temporarily unavailable because the Groq rate limit was reached. "
                    "Please try again after the reset time."
                )

            else:

                raise

    print(
        "\nAIRIS:",
        answer
    )

    messages.append(
        {
            "role": "user",
            "content": question
        }
    )

    messages.append(
        {
            "role": "assistant",
            "content": answer
        }
    )

    save_memory(
        messages
    )

    save_conversation_history(
        question,
        answer
    )

    return answer














def show_last_chats(
    count=10
):

    messages = load_memory()

    chats = []

    for msg in messages:

        if msg["role"] in [
            "user",
            "assistant"
        ]:

            chats.append(msg)

    print(
        f"\nLast {count} chats:\n"
    )

    for msg in chats[-count:]:

        print(
            f"[{msg['role'].upper()}]"
        )

        print(
            msg["content"][:200]
        )

        print("-" * 40)



def show_last_chat_pairs(
    count=10
):

    messages = load_memory()

    pairs = []

    i = 0

    while i < len(messages) - 1:

        if (
            messages[i]["role"] == "user"
            and messages[i + 1]["role"] == "assistant"
        ):

            pairs.append(
                (
                    messages[i]["content"],
                    messages[i + 1]["content"]
                )
            )

        i += 1

    print(
        f"\nLast {count} conversations:\n"
    )

    for user_msg, ai_msg in pairs[-count:]:

        print(
            f"YOU: {user_msg}"
        )

        print()

        print(
            f"AIRIS: {ai_msg[:300]}"
        )

        print(
            "\n" + "=" * 60 + "\n"
        )
def search_local_knowledge(
    question
):

    q = question.lower().strip()

    personal_keywords = [

        "my",
        "me",
        "mine",
        "who am i",
        "what is my",
        "tell me about myself",
        "about me",
        "do i",
        "am i",
        "which of my",
        "where do i",
        "what do i",
        "what have i",
        "what projects",
        "what awards",
        "what device",
        "what phone",
        "what bike",
        "what vehicle",
        "what skills",
        "what research",
        "what am i studying"

    ]

    is_personal = any(
        keyword in q
        for keyword in personal_keywords
    )

    if not is_personal:
        return None

    try:

        with open(
            LONG_TERM_MEMORY_FILE,
            "r",
            encoding="utf-8"
        ) as f:





            memory = json.load(
                f
            )

        return json.dumps(
            memory,
            indent=4,
            ensure_ascii=False
        )

    except Exception as e:

        print(
            "\nLOCAL SEARCH ERROR:",
            e
        )

        return None 
    
    
# ==========================================
# MAIN
# ==========================================




def main():

    create_required_files()

    messages = load_memory()

    print("\nAIRIS ONLINE")
    print("Commands:")
    print("exit, cls, time, forget")
    print("remember ...")
    print("calc 2+2")
    print("mkdir foldername")

    while True:

        question = input(
            "\nYou: "
        ).strip()

        if not question:
            continue

        q = question.lower()

        # ------------------------
        # Chat History
        # ------------------------

        if (
            "last" in q
            and "chat" in q
        ):

            show_last_chat_pairs(
                30
            )

            continue

        # ------------------------
        # Built-in Commands
        # ------------------------

        result = handle_command(
            question,
            messages
        )

        if result == "exit":
            break

        if result:
            continue

        # ------------------------
        # AI Response
        # ------------------------

        try:

            ask_airis(
                client,
                messages,
                question
            )

        except Exception as e:

            print(
                f"\nError: {e}"
            )     
            
            

if __name__ == "__main__":
    main()
