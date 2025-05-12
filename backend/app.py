# the python file where the backend can be stared inside the project without command line
from website import create_app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True)