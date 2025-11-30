import unicodedata

def remove_accents(input_str):
    if input_str is None:
        return None
    if not isinstance(input_str, str):
        return str(input_str)
    
    # Normalize unicode characters to NFD (Decomposition)
    nfkd_form = unicodedata.normalize('NFD', input_str)
    
    # Filter out non-spacing mark characters (combining diacritics)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])
