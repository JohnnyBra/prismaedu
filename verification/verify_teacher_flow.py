from playwright.sync_api import sync_playwright

def verify_teacher_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:3020")

            # 1. Main Screen
            page.wait_for_selector("text=Soy Profesor")
            print("Main screen loaded.")

            # 2. Click "Soy Profesor"
            page.click("text=Soy Profesor")
            print("Clicked 'Soy Profesor'.")

            # 3. Check Method Select Screen
            # Expect "Elige Método de Acceso"
            page.wait_for_selector("text=Elige Método de Acceso")

            # Check for buttons
            manual_btn = page.locator("text=Usuario y Contraseña")
            google_btn = page.locator("text=Google")

            if manual_btn.is_visible() and google_btn.is_visible():
                print("PASS: Both login methods are visible.")
            else:
                print("FAIL: Login methods missing.")

            # Take screenshot of Method Select
            page.screenshot(path="verification/teacher_method_select.png")

            # 4. Click "Usuario y Contraseña"
            manual_btn.click()
            print("Clicked 'Usuario y Contraseña'.")

            # 5. Check User Select Screen
            page.wait_for_selector("text=¿Quién eres?")

            # Ensure Google button is NOT here (reverted change)
            if page.locator("text=Entrar con Google").is_visible():
                 # Note: "Entrar con Google" text might exist in the DOM from the previous step if not unmounted properly or if my regex is loose,
                 # but here we moved to a new step renderUserSelect which should NOT have it.
                 # Wait, 'Entrar con Google' is the text in the Google button.
                 # In renderUserSelect I removed it.
                 print("FAIL: Google button should not be in User Select list.")
            else:
                 print("PASS: Google button is absent from User Select list.")

            # Take screenshot of User Select
            page.screenshot(path="verification/teacher_user_select.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_teacher_flow()
