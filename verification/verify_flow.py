from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        try:
            # 1. Login Page
            print("Navigating to login page...")
            page.goto("http://localhost:3000/login")
            page.wait_for_load_state("networkidle")

            # Click "Soy Familia"
            print("Clicking 'Soy Familia'...")
            page.get_by_role("button", name="Soy Familia").click()
            time.sleep(1)

            # 2. Class Selection
            print("Verifying Class Selection step...")
            page.wait_for_selector("text=Elige tu Clase")
            page.screenshot(path="verification/1_class_select.png")

            # Select the first class
            print("Selecting class...")
            page.locator(".grid > button").first.click()
            time.sleep(1)

            # 3. Family Selection
            print("Verifying Family Selection step...")
            page.wait_for_selector("text=Elige tu Familia")
            page.screenshot(path="verification/2_family_select.png")

            # Select the first family
            print("Selecting family...")
            page.locator(".grid > button").first.click()
            time.sleep(1)

            # 4. User Selection
            print("Verifying User Selection step...")
            page.wait_for_selector("text=¿Quién eres?")

            # Select the Parent user ("Admin Familia")
            print("Selecting Parent user...")
            parent_btn = page.locator("button").filter(has_text="Admin Familia").first
            if parent_btn.count() > 0:
                parent_btn.click()
            else:
                print("Warning: Parent not found, clicking first user.")
                page.locator(".grid > button").first.click()

            time.sleep(1)

            # 5. PIN Entry
            print("Entering PIN...")
            page.wait_for_selector("text=Introduce tu PIN")

            for digit in "0000":
                page.get_by_role("button", name=digit).click()
                time.sleep(0.1)

            # Click Entrar
            print("Clicking Entrar...")
            page.get_by_role("button", name="Entrar").click()

            # 6. Dashboard
            print("Verifying Dashboard...")
            page.wait_for_url("**/dashboard", timeout=10000)
            time.sleep(2) # Wait for header

            # Capture header text
            header_text = page.locator("header h1").first.inner_text()
            print(f"Dashboard Header Text: '{header_text}'")

            page.screenshot(path="verification/3_dashboard.png")
            print("Dashboard loaded successfully.")

        except Exception as e:
            print(f"Test failed: {e}")
            page.screenshot(path="verification/error_state.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
